import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Node } from '@/types/Node'
import type { NodeState } from '@/types/NodeState'
import type { Recipe } from '@/types/Recipe'
import type { Item } from '@/types/Item'
import { useReferenceStore } from './referenceStore'

// Internal list of NodeState objects used for persistence and mutation.
const nodeStates = ref<NodeState[]>([])
/**
 * A store managing node state.  Nodes on the canvas are represented by
 * lightweight NodeState entries which reference dictionary data by id.  The
 * store exposes a computed list of full Node objects that merge state with
 * items and recipes from the respective stores.  All mutation methods
 * operate on the underlying NodeState array to ensure separation of state
 * and dictionaries.
 */
export const useNodesStore = defineStore('nodes', () => {
  // Access to item and recipe dictionaries.
  const referenceStore = useReferenceStore()

  /**
   * Returns a list of Node objects by resolving itemId and recipeId into
   * actual Item and Recipe references.  Node objects returned from this
   * computed getter should be treated as read-only; to mutate state call
   * update methods on the store instead of modifying these objects directly.
   */
  // -------------------------------------------------------------------------
  // Node proxies
  //
  // The NodeEditPanel component expects the selected node to update
  // reactively whenever its underlying state changes (e.g. recipeId, veins,
  // buildingCount or coefficient).  The original implementation returned
  // freshly created plain objects on each call to getNodes(), causing Vue
  // components to hold stale references.  To fix this we create a proxy
  // object for each NodeState that exposes reactive getters and setters
  // directly bound to the NodeState entry.  We cache these proxies so
  // object identity is preserved across calls.  Each proxy defines
  // computed properties for fields derived from dictionary stores (item,
  // recipe and name).  Vue's reactivity system tracks the computed
  // dependencies so that changes to the NodeState or dictionaries are
  // automatically reflected in the components without requiring the user
  // to reselect the node.

  // Cache mapping node id to its proxy.  We use a plain object instead of
  // Map so that Vue can track deletions if necessary.
  const nodeCache: Record<number, Node> = {}

  /**
   * Return a reactive proxy for the given NodeState.  If a proxy already
   * exists for the state's id it will be reused.  The proxy exposes
   * getters/setters that read and write directly from the NodeState.  It
   * defines computed properties for item, recipe and name to ensure
   * dependencies on the itemsStore and recipesStore are tracked.
   */
  function getProxyForState(state: NodeState): Node {
    const existing = nodeCache[state.id]
    if (existing) {
      return existing
    }
    // Computed refs for derived properties
    const itemRef = computed<Item | undefined>(() => {
      return referenceStore.getItemById(state.itemId).value as Item | undefined
    })
    const recipeRef = computed<Recipe | undefined>(() => {
      if (state.recipeId) {
        const refRecipe = referenceStore.getRecipeById(state.recipeId)
        return refRecipe.value as Recipe | undefined
      }
      return undefined
    })
    const nameRef = computed<string>(() => {
      return itemRef.value?.name || ''
    })
    // Build the proxy object.  We use getters and setters on top-level
    // properties to read/write the underlying NodeState.  For derived
    // properties we expose the computed ref's value so components always
    // access the latest data.
    const proxy = {
      get id() {
        return state.id
      },
      get name() {
        return nameRef.value
      },
      get x() {
        return state.x
      },
      set x(val: number) {
        state.x = val
      },
      get y() {
        return state.y
      },
      set y(val: number) {
        state.y = val
      },
      get item() {
        return itemRef.value as Item
      },
      get recipe() {
        return recipeRef.value
      },
      set recipe(newRecipe: Recipe | undefined) {
        state.recipeId = newRecipe?.id
      },
      get veins() {
        return state.veins
      },
      set veins(val: number | undefined) {
        state.veins = val
      },
      get buildingCount() {
        return state.buildingCount
      },
      set buildingCount(val: number | undefined) {
        state.buildingCount = val
      },
      get coefficient() {
        return state.coefficient
      },
      set coefficient(val: number | undefined) {
        state.coefficient = val
      },
    } as unknown as Node
    // Make the proxy reactive so Vue tracks access to its getters and the
    // computed refs within them.
    const reactiveProxy = reactive(proxy) as unknown as Node
    nodeCache[state.id] = reactiveProxy
    return reactiveProxy
  }

  /**
   * Return the list of resolved Node proxies.  For each NodeState we
   * retrieve or create a proxy using getProxyForState().  We also clean up
   * the cache by removing proxies that no longer have a corresponding
   * NodeState (for example, after deletion).
   */
  function getNodes(): Node[] {
    // Remove stale proxies (ids missing from nodeStates)
    const currentIds = new Set(nodeStates.value.map((s) => s.id))
    Object.keys(nodeCache).forEach((idStr) => {
      const id = Number(idStr)
      if (!currentIds.has(id)) {
        delete nodeCache[id]
      }
    })
    // Return proxies for all states
    return nodeStates.value.map((state) => getProxyForState(state))
  }

  /**
   * Adds a new node to the canvas.  Accepts an object containing the id,
   * coordinates and selected item.  A default coefficient of 1 is set.
   */
  function addNode(newNode: { id: number; x: number; y: number; item: Item }): void {
    nodeStates.value.push({
      id: newNode.id,
      x: newNode.x,
      y: newNode.y,
      itemId: newNode.item.id,
      veins: undefined,
      buildingCount: undefined,
      coefficient: 1,
    })
  }

  /**
   * Removes a node by its id along with its state entry.
   */
  function removeNode(id: number): void {
    const index = nodeStates.value.findIndex((state) => state.id === id)
    if (index !== -1) {
      nodeStates.value.splice(index, 1)
    }
  }

  /**
   * Updates the recipeId for a given node.  Passing null clears the recipe.
   */
  function updateNodeRecipe(id: number, recipe: Recipe | null): void {
    const state = nodeStates.value.find((s) => s.id === id)
    if (state) {
      state.recipeId = recipe?.id
    }
  }

  /**
   * Updates the veins value for a given node.
   */
  function updateNodeVeins(id: number, veins: number): void {
    const state = nodeStates.value.find((s) => s.id === id)
    if (state) {
      state.veins = veins
    }
  }

  /**
   * Updates the buildingCount for a given node.
   */
  function updateNodeBuildingCount(id: number, buildingCount: number): void {
    const state = nodeStates.value.find((s) => s.id === id)
    if (state) {
      state.buildingCount = buildingCount
    }
  }

  /**
   * Updates the productivity coefficient for a given node.  The coefficient
   * scales both production and consumption for the node.  Passing undefined
   * will reset the coefficient to 1.
   */
  function updateNodeCoefficient(id: number, coefficient: number | undefined): void {
    const state = nodeStates.value.find((s) => s.id === id)
    if (state) {
      state.coefficient = coefficient === undefined ? 1 : coefficient
    }
  }

  /**
   * Updates the position of a node.  Used during drag operations on the
   * canvas.  Modifying the state here ensures that changes are propagated to
   * computed Node objects and watchers.
   */
  function updateNodePosition(id: number, x: number, y: number): void {
    const state = nodeStates.value.find((s) => s.id === id)
    if (state) {
      state.x = x
      state.y = y
    }
  }

  return {
    // Accessors
    getNodes,
    // Mutations
    addNode,
    removeNode,
    updateNodeRecipe,
    updateNodeVeins,
    updateNodeBuildingCount,
    updateNodeCoefficient,
    updateNodePosition,
  }
})
