import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Node } from '@/domain/types/Node'
import type { NodeState } from '@/domain/types/NodeState'
import type { Recipe } from '@/data-source/dto/recipe.dto'
import type { Item } from '@/data-source/dto/item.dto'
import { useItemsStore } from '@/stores/itemsStore'
import { useRecipesStore } from '@/stores/recipesStore'

const nodeStates = ref<NodeState[]>([])

export const useNodesStore = defineStore('nodes', () => {
    const itemsStore = useItemsStore()
    const recipesStore = useRecipesStore()

    const nodeCache: Record<number, Node> = {}

    function getProxyForState(state: NodeState): Node {
        const existing = nodeCache[state.id]
        if (existing) {
            return existing
        }

        const itemRef = computed<Item | undefined>(() => {
            return itemsStore.getItemById(state.itemId) as Item | undefined
        })

        const recipeRef = computed<Recipe | undefined>(() => {
            if (state.recipeId) {
                const refRecipe = recipesStore.getRecipeById(state.recipeId)
                return refRecipe.value as Recipe | undefined
            }
            return undefined
        })

        const nameRef = computed<string>(() => {
            return itemRef.value?.name || ''
        })

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

        const reactiveProxy = reactive(proxy) as unknown as Node
        nodeCache[state.id] = reactiveProxy
        return reactiveProxy
    }

    function getNodes(): Node[] {
        const currentIds = new Set(nodeStates.value.map((s) => s.id))
        Object.keys(nodeCache).forEach((idStr) => {
            const id = Number(idStr)
            if (!currentIds.has(id)) {
                delete nodeCache[id]
            }
        })
        return nodeStates.value.map((state) => getProxyForState(state))
    }

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

    function removeNode(id: number): void {
        const index = nodeStates.value.findIndex((state) => state.id === id)
        if (index !== -1) {
            nodeStates.value.splice(index, 1)
        }
    }

    function updateNodeRecipe(id: number, recipe: Recipe | null): void {
        const state = nodeStates.value.find((s) => s.id === id)
        if (state) {
            state.recipeId = recipe?.id
        }
    }

    function updateNodeVeins(id: number, veins: number): void {
        const state = nodeStates.value.find((s) => s.id === id)
        if (state) {
            state.veins = veins
        }
    }

    function updateNodeBuildingCount(id: number, buildingCount: number): void {
        const state = nodeStates.value.find((s) => s.id === id)
        if (state) {
            state.buildingCount = buildingCount
        }
    }

    function updateNodeCoefficient(id: number, coefficient: number | undefined): void {
        const state = nodeStates.value.find((s) => s.id === id)
        if (state) {
            state.coefficient = coefficient === undefined ? 1 : coefficient
        }
    }

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
