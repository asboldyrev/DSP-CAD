import type { Category } from '@/data-source/category'

export interface Recipe {
    category: Category
    id: string
    name: string
    time: number
    in: In
    out: Out
    producers: string[]
    row: number
    flags?: string[]
    icon?: string
    usage?: number | string
    cost?: number
}

export interface In {
    [key: string]: number
}

export interface Out {
    [key: string]: number
}
