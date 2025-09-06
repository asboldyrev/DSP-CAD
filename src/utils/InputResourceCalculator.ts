import type { Node } from '@/types/Node'
import type { Connection } from '@/types/Connection'
import { ThroughputCalculator } from './ThroughputCalculator'
import { ProductionCalculator } from './ProductionCalculator'

export interface InputResource {
    resourceId: string
    resourceName: string
    requiredPerSecond: number // Сколько нужно в секунду по рецепту
    availablePerSecond: number // Сколько доступно через связи
    throughput: number // Пропускная способность связи
    isSufficient: boolean // Достаточно ли ресурса
}

export interface InputResourceResult {
    resources: InputResource[]
    limitingResource?: string // Ресурс, который ограничивает производительность
    maxProductionRate: number // Максимальная скорость производства с учетом входных ресурсов
}

export class InputResourceCalculator {
    /**
     * Рассчитывает доступные входные ресурсы для ноды
     */
    static calculateInputResources(
        node: Node,
        connections: Connection[],
        allNodes: Node[]
    ): InputResourceResult {
        if (!node.recipe) {
            return {
                resources: [],
                maxProductionRate: 0
            }
        }

        // Получаем входящие связи для этой ноды
        const incomingConnections = connections.filter(conn => conn.toNodeId === node.id)
        
        
        // Получаем входные ресурсы из рецепта
        const inputEntries = Object.entries(node.recipe.in as unknown as Record<string, number>)
        
        const resources: InputResource[] = []
        let maxProductionRate = Infinity

        for (const [resourceId, requiredPerCycle] of inputEntries) {
            // Рассчитываем сколько нужно в секунду
            const requiredPerSecond = (requiredPerCycle / node.recipe!.time) * (node.item.machine?.speed || 1) * (node.buildingCount || 1)
            
            // Находим связи, которые поставляют этот ресурс
            let resourceConnections = incomingConnections.filter(conn => 
                conn.selectedResource === resourceId
            )
            
            // Если нет связей с выбранным ресурсом, но есть связи без выбранного ресурса,
            // и источник производит только этот ресурс, то используем эти связи
            if (resourceConnections.length === 0) {
                resourceConnections = incomingConnections.filter(conn => {
                    if (conn.selectedResource) return false // Уже есть выбранный ресурс
                    
                    const fromNode = allNodes.find(n => n.id === conn.fromNodeId)
                    if (!fromNode?.recipe) return false
                    
                    // Проверяем, производит ли источник только этот ресурс
                    const outputEntries = Object.entries(fromNode.recipe.out as unknown as Record<string, number>)
                    return outputEntries.length === 1 && outputEntries[0][0] === resourceId
                })
            }
            
            
            // Рассчитываем общую доступную пропускную способность для этого ресурса
            let availablePerSecond = 0
            
            for (const connection of resourceConnections) {
                const fromNode = allNodes.find(n => n.id === connection.fromNodeId)
                if (fromNode) {
                    const throughputResult = ThroughputCalculator.calculateThroughput(
                        connection,
                        fromNode,
                        node,
                        connection.inputSorter,
                        connection.outputSorter,
                        connection.belt
                    )
                    availablePerSecond += throughputResult.throughput
                }
            }
            
            const resource: InputResource = {
                resourceId,
                resourceName: resourceId, // TODO: Получить название из itemsStore
                requiredPerSecond,
                availablePerSecond,
                throughput: availablePerSecond,
                isSufficient: availablePerSecond >= requiredPerSecond
            }
            
            resources.push(resource)
            
            // Рассчитываем максимальную скорость производства для этого ресурса
            if (requiredPerSecond > 0) {
                const maxRateForResource = availablePerSecond / requiredPerSecond
                maxProductionRate = Math.min(maxProductionRate, maxRateForResource)
            }
        }
        
        // Находим ограничивающий ресурс
        const limitingResource = resources.find(r => !r.isSufficient)?.resourceId
        
        return {
            resources,
            limitingResource,
            maxProductionRate: maxProductionRate === Infinity ? 1 : maxProductionRate
        }
    }
    
    /**
     * Рассчитывает фактическую производительность ноды с учетом входных ресурсов
     */
    static calculateActualProductionRate(
        node: Node,
        connections: Connection[],
        allNodes: Node[]
    ): number {
        const inputResult = this.calculateInputResources(node, connections, allNodes)
        
        // Если нет ограничений по ресурсам, возвращаем полную производительность
        if (inputResult.maxProductionRate >= 1) {
            const productionResult = ProductionCalculator.calculateProduction(node)
            return productionResult.rate
        }
        
        // Иначе ограничиваем производительность доступными ресурсами
        const productionResult = ProductionCalculator.calculateProduction(node)
        return productionResult.rate * inputResult.maxProductionRate
    }
}