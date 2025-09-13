import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Item } from '@/types/Item'
import type { Recipe } from '@/types/Recipe'
import type { Icon } from '@/types/Icon'
// Import the normalised dictionary implementation.  When integrating into
// the real project this path should be adjusted relative to the src
// directory.  The class encapsulates loading items and recipes and exposes
// O(1) lookups by id as well as grouped retrievals.
import { Dictionaries } from '@/core/dictionaries'

/**
 * A Pinia store that centralises loading and access to reference data.  It
 * wraps the `Dictionaries` class defined in the improved architecture and
 * exposes reactive helpers for the UI and calculators.  Consumers should
 * call `loadReference()` once at application start to populate the
 * dictionaries; subsequent calls are ignored.  Lookup methods return
 * computed refs so that Vue tracks dependencies and updates components
 * whenever the underlying dictionary changes.
 */
export const useReferenceStore = defineStore('reference', () => {
  // Internal dictionary instance.  We keep it inside a ref so that Vue can
  // react to its replacement if ever needed (e.g. when reloading data).
  const dicts = ref(new Dictionaries())
  // Loading and error flags mirror the existing stores for consistency.
  const isLoading = ref(false)
  const error = ref(null as string | null)

  /**
   * Fetch buildings, icons and recipes from the server and populate the
   * dictionary.  Buildings and icons are fetched in parallel and combined
   * before loading into the dictionary.  If the data has already been
   * loaded (items map is non‑empty) the call is ignored.  Errors are
   * captured and stored in `error` for inspection by the UI.
   */
  async function loadReference(): Promise<void> {
    // Avoid reloading if we already have data
    if (dicts.value.itemsById.size > 0) return
    isLoading.value = true
    error.value = null
    try {
      // Parallel fetch of buildings and icons.  Icons are stored
      // separately in the original application and must be joined onto the
      // items by id.
      const [buildingsResp, iconsResp, recipesResp] = await Promise.all([
        fetch('/data/Items/buildings.json'),
        fetch('/data/icons.json'),
        fetch('/data/recipes.json')
      ])
      if (!buildingsResp.ok) {
        throw new Error(`HTTP error fetching buildings: ${buildingsResp.status}`)
      }
      if (!iconsResp.ok) {
        throw new Error(`HTTP error fetching icons: ${iconsResp.status}`)
      }
      if (!recipesResp.ok) {
        throw new Error(`HTTP error fetching recipes: ${recipesResp.status}`)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBuildings: any[] = await buildingsResp.json()
      const rawIcons: Icon[] = await iconsResp.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemsWithIcons: any[] = rawBuildings.map((item) => {
        const icon = rawIcons.find((ic) => ic.id === item.id)
        return {
          ...item,
          icon
        }
      })
      // Load items into the dictionary.  This indexes items by id,
      // by row and separates belts and sorters.
      dicts.value.loadItems(itemsWithIcons as Item[])
      // Load recipes separately; recipes may reference producers which are
      // resolved on demand.
      const rawRecipes: Recipe[] = await recipesResp.json()
      dicts.value.loadRecipes(rawRecipes)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Capture the error message for UI display
      error.value = err instanceof Error ? err.message : String(err)
      console.error('Failed to load reference data:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Retrieve an item by its identifier.  Returns a computed ref so that
   * components remain reactive to changes in the dictionary.
   *
   * @param id Identifier of the item
   */
  function getItemById(id: string) {
    return computed(() => dicts.value.getItem(id))
  }

  /**
   * Retrieve a recipe by its identifier.  Returns a computed ref for
   * reactivity.
   *
   * @param id Identifier of the recipe
   */
  function getRecipeById(id: string) {
    return computed(() => dicts.value.getRecipe(id))
  }

  function getMaxRowItems() {
    return computed(() => dicts.value.itemsByRow.keys().reduce((max, row) => Math.max(max, row), 0))
  }

  /**
   * Retrieve all items on a given row.  Useful for grouping items in the
   * UI by their row number.  Returns a computed ref of an array of items.
   *
   * @param row Row index
   */
  function getItemsByRow(row: number) {
    return computed(() => dicts.value.getItemsByRow(row))
  }

  /**
   * Retrieve all recipes produced by the given building.  Uses the
   * `recipesByProducer` index for constant‑time lookup.  Returns a
   * computed ref of an array of recipes.
   *
   * @param producerId Identifier of the producer (building)
   */
  function getRecipesByProducer(producerId: string) {
    return computed(() => {
      const recipeIds = dicts.value.recipesByProducer.get(producerId)
      if (!recipeIds) return []
      const result: Recipe[] = []
      recipeIds.forEach((rid) => {
        const r = dicts.value.getRecipe(rid)
        if (r) result.push(r)
      })
      return result
    })
  }

  /**
   * Retrieve all items flagged as belts.  Belts are indexed by id for
   * constant‑time access and returned as an array.  Use this to present
   * belt selection lists in the UI.
   */
  const getAllBelts = computed(() => {
    if (dicts.value.beltsById.size === 0) {
      return []
    }
    return Array.from(dicts.value.beltsById.values())
  })

  /**
   * Retrieve all items flagged as sorters.  Sorters are indexed by id for
   * constant‑time access and returned as an array.  Use this to present
   * sorter selection lists in the UI.
   */
  const getAllSorters = computed(() => {
    if (dicts.value.sortersById.size === 0) {
      return []
    }
    return Array.from(dicts.value.sortersById.values())
  })

  /**
   * Retrieve all loaded items.  Returns an array of Item.  Useful for
   * displaying the entire palette of buildings.
   */
  const getAllItems = computed(() => {
    if (dicts.value.itemsById.size === 0) {
      return []
    }
    return Array.from(dicts.value.itemsById.values())
  })

  /**
   * Retrieve all loaded recipes.  Returns an array of Recipe.
   */
  const getAllRecipes = computed(() => {
    if (dicts.value.recipesById.size === 0) {
      return []
    }
    return Array.from(dicts.value.recipesById.values())
  })

  return {
    // Reactive state
    isLoading,
    error,
    // Data structure
    dicts,
    // Actions
    loadReference,
    // Lookup helpers
    getItemById,
    getRecipeById,
    getItemsByRow,
    getRecipesByProducer,
    getItemsRowRange,
    // Collections
    getAllBelts,
    getAllSorters,
    getAllItems,
    getAllRecipes
  }
})
