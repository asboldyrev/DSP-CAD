import type { Item } from "./Item";
import type { Recipe } from "./Recipes";

export interface Node {
    id: number,
    name: string,
    x: number,
    y: number,
    item: Item,
    recipe?: Recipe
}