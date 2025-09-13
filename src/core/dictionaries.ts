import type { Item } from '@/types/Item'
import type { Recipe } from '@/types/Recipe'

/**
 * A normalised dictionary of reference data.  Keys are IDs and values are
 * immutable objects.  Additional indexes (e.g. itemsByRow, recipesByProducer)
 * are maintained for quick lookups.
 */
export class Dictionaries {
    public readonly itemsById: Map<string, Item> = new Map()
    public readonly recipesById: Map<string, Recipe> = new Map()
    public readonly beltsById: Map<string, Item> = new Map()
    public readonly sortersById: Map<string, Item> = new Map()
    public readonly recipesByProducer: Map<string, Set<string>> = new Map()
    public readonly itemsByRow: Map<number, Set<string>> = new Map()

    /**
     * Load items from raw JSON.  Items are indexed by ID and by row.
     */
    loadItems(rawItems: Item[]): void {
      for (const item of rawItems) {
        this.itemsById.set(item.id, item)

        // Index by row for UI grouping
        const row = item.row ?? 0
        if (!this.itemsByRow.has(row)) {
          this.itemsByRow.set(row, new Set())
        }
        this.itemsByRow.get(row)!.add(item.id)

        // Index belts and sorters separately
        if (item.belt) {
          this.beltsById.set(item.id, item)
        }

        // In the original data, sorters are separate items with `machine.speed`
        // but no belt property.  If machine has speed and item category
        // indicates sorter, treat it accordingly (this heuristic may need to be
        // refined when integrating with the real dataset).
        if (item.machine?.speed && !item.belt) {
          this.sortersById.set(item.id, item)
        }
      }
    }

    /**
     * Load recipes from raw JSON.  Recipes are indexed by ID and by producer.
     */
    loadRecipes(rawRecipes: Recipe[]): void {
      for (const recipe of rawRecipes) {
        this.recipesById.set(recipe.id, recipe)
        for (const producer of recipe.producers) {
          if (!this.recipesByProducer.has(producer)) {
            this.recipesByProducer.set(producer, new Set())
          }
          this.recipesByProducer.get(producer)!.add(recipe.id)
        }
      }
    }

    /**
     * Retrieve an item by ID in O(1) time.  Returns undefined if not found.
     */
    getItem(id: string): Item | undefined {
      return this.itemsById.get(id)
    }

    /**
     * Retrieve a recipe by ID in O(1) time.
     */
    getRecipe(id: string): Recipe | undefined {
      return this.recipesById.get(id)
    }

    /**
     * Retrieve all items in a given row.  Returns an array of items; if no
     * items exist for the row, returns an empty array.
     */
    getItemsByRow(row: number): Item[] {
      const ids = this.itemsByRow.get(row)
      if (!ids) return []
      return Array.from(ids).map((id) => this.itemsById.get(id)!).filter(Boolean)
    }
  }
