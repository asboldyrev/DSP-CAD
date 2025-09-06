import type { Node } from '@/types/Node'
import type { Connection } from '@/types/Connection'
import type { Item } from '@/types/Item'
import { ProductionCalculator } from './ProductionCalculator'

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
        belt?: Item
    ): ThroughputResult {
        // Получаем скорость производства исходной ноды
        const producerRate = this.getProducerRate(fromNode)
        
        // Получаем скорости сортеров
        const inputSorterRate = inputSorter ? this.getSorterRate(inputSorter) : Infinity
        const outputSorterRate = outputSorter ? this.getSorterRate(outputSorter) : Infinity
        
        // Получаем скорость конвейера
        const beltRate = belt ? this.getBeltRate(belt) : Infinity
        
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
     * Получает скорость производства ноды (для майнеров)
     */
    private static getProducerRate(node: Node): number {
        if (!node.recipe) return 0
        
        // Используем существующий ProductionCalculator для майнеров
        const productionResult = ProductionCalculator.calculateProduction(node)
        return productionResult.rate
    }
    
    /**
     * Получает скорость сортера (штук в секунду)
     */
    private static getSorterRate(sorter: Item): number {
        // Используем скорость из machine.speed
        return sorter.machine?.speed || 0
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
        return ProductionCalculator.isMiner(node)
    }
}