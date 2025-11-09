import type { Item } from '@/data-source/dto/item.dto'
import type { Point } from '@/data-source/dto/point.dto'

export interface Connection {
    id: number
    fromNodeId: number
    toNodeId: number
    from: Point
    to: Point
    belt?: Item
    inputSorter?: Item
    outputSorter?: Item
    syncSorters?: boolean
    selectedResource?: string // ID ресурса из рецепта
}

export interface ConnectionState {
    isCreatingConnection: boolean
    selectedNodeId: number | null
}
