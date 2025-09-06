import type { Node } from '@/types/Node'
import type { Connection } from '@/types/Connection'
import type { Item } from '@/types/Item'
import { ProductionCalculator } from './ProductionCalculator'
import { InputResourceCalculator } from './InputResourceCalculator'
import { OutputDistributionCalculator } from './OutputDistributionCalculator'

export interface ThroughputResult {
    throughput: number // штук в секунду
    unit: string // единица измерения
    bottlenecks: string[] // узкие места
    calculation: {
        producerRate: number
        inputSorterRate: number
        outputSorterRate: number
        beltRate: number
    }
}

export class ThroughputCalculator {
    /**
     * Рассчитывает пропускную способность связи
     */
    static calculateThroughput(
        connection: Connection,
        fromNode: Node,
        toNode: Node,
        inputSorter?: Item,
        outputSorter?: Item,
        belt?: Item,
        allConnections?: Connection[],
        allNodes?: Node[]
    ): ThroughputResult {
        // Получаем скорость производства исходной ноды с учетом распределения между связями
        const producerRate = this.getDistributedProducerRate(connection, fromNode, allConnections, allNodes)
        
        // Получаем скорости сортеров с учетом количества строений/жил
        const fromNodeCount = this.isMiner(fromNode) ? (fromNode.veins || 1) : (fromNode.buildingCount || 1)
        const toNodeCount = this.isMiner(toNode) ? (toNode.veins || 1) : (toNode.buildingCount || 1)
        
        const inputSorterRate = inputSorter ? this.getSorterRate(inputSorter, fromNodeCount) : Infinity
        const outputSorterRate = outputSorter ? this.getSorterRate(outputSorter, toNodeCount) : Infinity
        
        // Получаем скорость конвейера
        const beltRate = belt ? this.getBeltRate(belt) : Infinity
        
        console.log('ThroughputCalculator.calculateThroughput:', {
            connectionId: connection.id,
            fromNode: fromNode.item.name,
            toNode: toNode.item.name,
            fromNodeCount,
            toNodeCount,
            producerRate: producerRate.toFixed(2),
            inputSorterRate: inputSorterRate === Infinity ? 'Infinity' : inputSorterRate.toFixed(2),
            outputSorterRate: outputSorterRate === Infinity ? 'Infinity' : outputSorterRate.toFixed(2),
            beltRate: beltRate === Infinity ? 'Infinity' : beltRate.toFixed(2),
            outgoingConnections: allConnections?.filter(c => c.fromNodeId === fromNode.id).length || 0
        })
        
        // Пропускная способность = минимум из всех скоростей
        const throughput = Math.min(producerRate, inputSorterRate, outputSorterRate, beltRate)
        
        // Определяем узкие места
        const bottlenecks: string[] = []
        if (throughput === producerRate) bottlenecks.push('Производство')
        if (throughput === inputSorterRate) bottlenecks.push('Входной сортер')
        if (throughput === outputSorterRate) bottlenecks.push('Выходной сортер')
        if (throughput === beltRate) bottlenecks.push('Конвейер')
        
        return {
            throughput,
            unit: 'шт/сек',
            bottlenecks,
            calculation: {
                producerRate,
                inputSorterRate: inputSorterRate === Infinity ? 0 : inputSorterRate,
                outputSorterRate: outputSorterRate === Infinity ? 0 : outputSorterRate,
                beltRate: beltRate === Infinity ? 0 : beltRate
            }
        }
    }
    
    /**
     * Получает скорость производства ноды (для майнеров и процессоров)
     */
    static getProducerRate(node: Node, allConnections?: Connection[], allNodes?: Node[]): number {
        if (!node.recipe) return 0
        
        // Для майнеров используем обычный расчет
        if (this.isMiner(node)) {
            const productionResult = ProductionCalculator.calculateProduction(node)
            return productionResult.rate
        }
        
        // Для процессоров учитываем входные ресурсы
        if (this.isProcessor(node) && allConnections && allNodes) {
            return InputResourceCalculator.calculateActualProductionRate(node, allConnections, allNodes)
        }
        
        // Fallback для процессоров без связей
        const productionResult = ProductionCalculator.calculateProduction(node)
        return productionResult.rate
    }

    /**
     * Получает распределенную скорость производства для конкретной связи
     */
    private static getDistributedProducerRate(
        connection: Connection,
        fromNode: Node,
        allConnections?: Connection[],
        allNodes?: Node[]
    ): number {
        console.log('getDistributedProducerRate:', {
            connectionId: connection.id,
            fromNodeId: fromNode.id,
            fromNodeName: fromNode.item.name,
            hasConnections: !!allConnections,
            hasNodes: !!allNodes
        })

        if (!allConnections || !allNodes) {
            const rate = this.getProducerRate(fromNode, allConnections, allNodes)
            console.log('Fallback rate (no connections/nodes):', rate)
            return rate
        }

        // Получаем все исходящие связи от источника
        const outgoingConnections = allConnections.filter(conn => conn.fromNodeId === fromNode.id)
        console.log('Outgoing connections:', outgoingConnections.length)
        
        if (outgoingConnections.length <= 1) {
            // Если связь одна, используем полную производительность
            const rate = this.getProducerRate(fromNode, allConnections, allNodes)
            console.log('Single connection rate:', rate)
            return rate
        }

        // Если связей несколько, распределяем производительность
        const distributedRate = OutputDistributionCalculator.getAllocatedRateForConnection(
            connection.id,
            fromNode,
            outgoingConnections,
            allNodes
        )
        console.log('Distributed rate:', distributedRate)
        return distributedRate
    }
    
    /**
     * Получает скорость сортера (штук в секунду) с учетом количества строений
     */
    private static getSorterRate(sorter: Item, buildingCount: number = 1): number {
        // Используем скорость из machine.speed и умножаем на количество строений
        const baseRate = sorter.machine?.speed || 0
        return baseRate * buildingCount
    }
    
    /**
     * Получает скорость конвейера (штук в секунду)
     */
    private static getBeltRate(belt: Item): number {
        // Конвейеры имеют скорость в поле belt.speed
        return belt.belt?.speed || 0
    }
    
    /**
     * Форматирует пропускную способность для отображения
     */
    static formatThroughput(result: ThroughputResult): string {
        if (result.throughput === 0) return '0 шт/сек'
        
        // Всегда показываем в секундах
        return `${result.throughput.toFixed(2)} шт/сек`
    }
    
    /**
     * Проверяет, является ли нода майнером
     */
    static isMiner(node: Node): boolean {
        return ProductionCalculator.isMiner(node.item.id)
    }

    /**
     * Проверяет, является ли нода процессором
     */
    static isProcessor(node: Node): boolean {
        return ProductionCalculator.isProcessor(node)
    }
}