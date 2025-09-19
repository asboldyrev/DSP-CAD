import type { Category } from '@/data-source/category'
import type { Icon } from '@/data-source/dto/icon.dto'

export interface Item {
    category: Category
    id: string
    name: string
    row?: number
    stack?: number
    machine?: Machine
    fuel?: Fuel
    belt?: Belt
    icon?: Icon
    module?: Module
    technology: Technology
}

export interface Machine {
    drain: number
    type: string
    usage: number
    speed: number
    fuelCategories: Array<string>
    modules: number
    totalRecipe: boolean
}

export interface Fuel {
    category: string
    value: number
}

export interface Belt {
    speed: number
}

export interface Module {
    consumption: number
    limitation: string
    productivity: number
    proliferator: string
    sprays: number
    speed: number
}

export interface Technology {
    prerequisites: Array<string>
    unlockedRecipes: Array<string>
}
