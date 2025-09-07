import type { Node } from '@/types/Node'
import type { Connection } from '@/types/Connection'
import { ThroughputCalculator } from './ThroughputCalculator'
import { ProductionCalculator } from './ProductionCalculator'

export interface OutputDistribution {
    connectionId: number
    resourceId: string
    allocatedRate: number // Выделенная скорость для этой связи
    maxPossibleRate: number // Максимально возможная скорость (без учета других связей)
}

export interface OutputDistributionResult {
    distributions: OutputDistribution[]
    totalAllocatedRate: number // Общая выделенная скорость
    isFullyUtilized: boolean // Полностью ли используется производительность источника
}

export class OutputDistributionCalculator {
    /**
     * Рассчитывает распределение производительности источника между исходящими связями
     */
    static calculateOutputDistribution(
        sourceNode: Node,
        outgoingConnections: Connection[],
        allNodes: Node[],
        allConnections?: Connection[]
    ): OutputDistributionResult {
        console.log('OutputDistributionCalculator.calculateOutputDistribution:', {
            sourceNodeId: sourceNode.id,
            sourceNodeName: sourceNode.item.name,
            outgoingConnections: outgoingConnections.length,
            hasRecipe: !!sourceNode.recipe
        })

        if (!sourceNode.recipe || outgoingConnections.length === 0) {
            return {
                distributions: [],
                totalAllocatedRate: 0,
                isFullyUtilized: false
            }
        }

        // Получаем общую производительность источника (без учета входных ресурсов для избежания рекурсии)
        // Получаем общую базовую производительность источника
        const baseTotalRate = this.getBaseProductionRate(sourceNode)

        // Если есть информация о всех связях и нодах, определяем фактическую
        // производительность с учетом входных ресурсов.  Используем
        // ThroughputCalculator.getProducerRate, который для процессоров
        // обращается к InputResourceCalculator.calculateActualProductionRate и
        // тем самым учитывает ограничения по входам.  Для майнеров
        // getProducerRate использует ProductionCalculator.
        let actualTotalRate = baseTotalRate
        if (allConnections && allNodes) {
            // Note: getProducerRate already uses actual input constraints when
            // called with connections and nodes.  Passing allConnections and
            // allNodes avoids recursion because it will not invoke
            // OutputDistributionCalculator again for this node during this call.
            actualTotalRate = ThroughputCalculator.getProducerRate(sourceNode, allConnections, allNodes)
        }

        // Определяем коэффициент масштабирования.  Если actualTotalRate меньше
        // базовой производительности, мы пропорционально уменьшаем скорости
        // распределения для всех ресурсов.  Если равен, коэффициент = 1.
        const scaleFactor = baseTotalRate > 0 ? Math.min(1, actualTotalRate / baseTotalRate) : 0
        // console.log('Total production rate:', totalProductionRate)
        
        // Группируем связи по ресурсам
        const connectionsByResource = new Map<string, Connection[]>()
        
        for (const connection of outgoingConnections) {
            const resourceId = connection.selectedResource || this.getDefaultResource(sourceNode, connection, allNodes)
            console.log('Connection resource:', {
                connectionId: connection.id,
                selectedResource: connection.selectedResource,
                defaultResource: resourceId
            })
            if (resourceId) {
                if (!connectionsByResource.has(resourceId)) {
                    connectionsByResource.set(resourceId, [])
                }
                connectionsByResource.get(resourceId)!.push(connection)
            }
        }
        
        console.log('Connections by resource:', Array.from(connectionsByResource.entries()).map(([resource, connections]) => ({
            resource,
            connections: connections.length
        })))

        const distributions: OutputDistribution[] = []
        let totalAllocatedRate = 0

        // Распределяем производительность по ресурсам
        for (const [resourceId, connections] of connectionsByResource) {
            // Базовая производительность для этого ресурса (без учета входных ограничений)
            const baseResourceRate = this.getResourceProductionRate(sourceNode, resourceId)
            // Применяем коэффициент масштабирования, чтобы учитывалась фактическая
            // производительность, ограниченная входными ресурсами
            const scaledResourceRate = baseResourceRate * scaleFactor
            
            // Равномерно распределяем между связями этого ресурса
            
            const ratePerConnection = scaledResourceRate / connections.length
            for (const connection of connections) {
                distributions.push({
                    connectionId: connection.id,
                    resourceId,
                    allocatedRate: ratePerConnection,
                    // maxPossibleRate отражает максимальную базовую скорость без
                    // учета входных ограничений.  Для обратной совместимости
                    maxPossibleRate: baseResourceRate
                })
                totalAllocatedRate += ratePerConnection
            }
        }
        
        console.log('Final distributions:', distributions)
        console.log('Total allocated rate:', totalAllocatedRate)

        return {
            distributions,
            totalAllocatedRate,
            // isFullyUtilized показывает, что фактическая производительность
            // полностью распределена.  Сравниваем с actualTotalRate, а не с
            // базовой производительностью.
            isFullyUtilized: Math.abs(totalAllocatedRate - actualTotalRate) < 0.01
        }
    }

    /**
     * Получает производительность источника для конкретного ресурса
     */
    private static getResourceProductionRate(sourceNode: Node, resourceId: string): number {
        if (!sourceNode.recipe) {
            console.log('No recipe for node:', sourceNode.name)
            return 0
        }

        // Получаем общую производительность источника (базовую, без учета входных ресурсов)
        const totalRate = this.getBaseProductionRate(sourceNode)
        console.log('Total rate for resource calculation:', totalRate)
        
        // Получаем выходные ресурсы рецепта
        const outputEntries = Object.entries(sourceNode.recipe.out as unknown as Record<string, number>)
        const totalOutputPerCycle = outputEntries.reduce((sum, [_, quantity]) => sum + quantity, 0)
        console.log('Recipe outputs:', outputEntries)
        console.log('Total output per cycle:', totalOutputPerCycle)
        
        // Находим количество конкретного ресурса за цикл
        const resourcePerCycle = outputEntries.find(([id]) => id === resourceId)?.[1] || 0
        console.log('Looking for resource:', resourceId, 'Found quantity:', resourcePerCycle)
        
        // Рассчитываем долю этого ресурса в общей производительности
        if (totalOutputPerCycle === 0) {
            console.log('Total output per cycle is 0')
            return 0
        }
        
        const resourceRate = totalRate * (resourcePerCycle / totalOutputPerCycle)
        console.log('Resource rate calculation:', {
            totalRate,
            resourcePerCycle,
            totalOutputPerCycle,
            resourceRate
        })
        
        return resourceRate
    }

    /**
     * Получает ресурс по умолчанию для связи (если не указан selectedResource)
     */
    private static getDefaultResource(sourceNode: Node, connection: Connection, allNodes: Node[]): string | null {
        if (!sourceNode.recipe) return null

        // Если источник производит только один ресурс, используем его
        const outputEntries = Object.entries(sourceNode.recipe.out as unknown as Record<string, number>)
        if (outputEntries.length === 1) {
            return outputEntries[0][0]
        }

        // Если несколько ресурсов, пытаемся определить по получателю
        const toNode = allNodes.find(n => n.id === connection.toNodeId)
        if (toNode?.recipe) {
            const inputEntries = Object.entries(toNode.recipe.in as unknown as Record<string, number>)
            // Ищем пересечение между выходом источника и входом получателя
            for (const [resourceId] of inputEntries) {
                if (outputEntries.some(([id]) => id === resourceId)) {
                    return resourceId
                }
            }
        }

        return null
    }

    /**
     * Получает выделенную скорость для конкретной связи
     */
    static getAllocatedRateForConnection(
        connectionId: number,
        sourceNode: Node,
        outgoingConnections: Connection[],
        allNodes: Node[],
        allConnections?: Connection[]
    ): number {
        const result = this.calculateOutputDistribution(sourceNode, outgoingConnections, allNodes, allConnections)
        const distribution = result.distributions.find(d => d.connectionId === connectionId)
        return distribution?.allocatedRate || 0
    }

    /**
     * Получает базовую производительность ноды без учета входных ресурсов (для избежания рекурсии)
     */
    private static getBaseProductionRate(node: Node): number {
        if (!node.recipe) return 0
        
        // Используем ProductionCalculator напрямую, без учета входных ресурсов
        const productionResult = ProductionCalculator.calculateProduction(node)
        return productionResult.rate
    }
}