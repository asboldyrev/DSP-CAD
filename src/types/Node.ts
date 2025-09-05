import type { Item } from "./Item";

export interface Node {
    id: number,
    name: string,
    x: number,
    y: number,
    item: Item
}