import type { Item } from "./Item";
import type { Recipe } from "./Recipes";

export interface Node {
    id: number,
    name: string,
    x: number,
    y: number,
    item: Item,
    recipe?: Recipe,
    veins?: number,
    buildingCount?: number, // Количество строений (для всех типов)
    /**
     * Productivity coefficient.  Values greater than 1 boost production and
     * consumption while values below 1 reduce it.  When undefined it is
     * treated as 1.
     */
    coefficient?: number // Коэффициент производительности
}