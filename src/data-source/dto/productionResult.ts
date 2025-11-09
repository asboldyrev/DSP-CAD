export interface ProductionResult {
    rate: number
    inputUnit: string
    outputUnit: string
    inputLabel: string
    inputType: 'veins' | 'rate' | 'buildings'
    inputMin: number
    inputMax: number
    inputStep: number
    inputPrecision: number
}
