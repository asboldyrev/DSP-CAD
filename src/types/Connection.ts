import type { Item } from './Item'

export interface Connection {
  id: number
  fromNodeId: number
  toNodeId: number
  fromX: number
  fromY: number
  toX: number
  toY: number
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