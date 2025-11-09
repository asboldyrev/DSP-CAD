import type { Item } from '@/data-source/dto/item.dto'
import type { Recipe } from '@/data-source/dto/recipe.dto'
import type { Point } from '@/data-source/dto/point.dto'

export interface Node {
    id: number
    name: string
    coord: Point
    item: Item
    recipe?: Recipe
    factor?: number
    coefficient?: number // Коэффициент производительности
}
