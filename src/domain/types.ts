// -----------------------------------------------------------------------------
// Node and connection state
//
// Calculation state holds only the minimal information required for throughput
// and production calculations.  UI state can be derived from these objects
// when rendering.

export interface NodeCalcState {
    id: number
    x: number
    y: number
    itemId: string
    recipeId?: string
    veins?: number
    buildingCount?: number
    coefficient?: number
}

export interface ConnectionCalcState {
    id: number
    fromNodeId: number
    toNodeId: number
    beltId?: string
    inputSorterId?: string
    outputSorterId?: string
    syncSorters?: boolean
    selectedResource?: string
}
