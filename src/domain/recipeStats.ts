import type { Recipe } from '@/tmp/types/core/recipe'

/**
 * A lightweight class for precomputing and storing recipe throughput values.
 * This demonstrates suggestion #4 (precompute and cache results).  In the
 * existing code, the total output per cycle and other values are recalculated
 * repeatedly.  Here we compute them once and expose getters.
 */
export class RecipeStats {
    totalOutputPerCycle: number
    inputsPerSecond: Map<string, number> = new Map()
    outputsPerSecond: Map<string, number> = new Map()

    constructor(
        private readonly recipe: Recipe,
        private readonly producerSpeed: number,
    ) {
        // Compute total output per cycle
        this.totalOutputPerCycle = Object.values(recipe.out).reduce((sum, qty) => sum + qty, 0)
        // Compute per‑second rates
        for (const [resource, qty] of Object.entries(recipe.in)) {
            this.inputsPerSecond.set(resource, (qty / recipe.time) * producerSpeed)
        }
        for (const [resource, qty] of Object.entries(recipe.out)) {
            this.outputsPerSecond.set(resource, (qty / recipe.time) * producerSpeed)
        }
    }
}
