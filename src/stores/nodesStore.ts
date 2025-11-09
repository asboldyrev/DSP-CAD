import type { Node } from '@/data-source/dto/node.dto'
import { defineStore } from 'pinia'
import { ref, computed, reactive, type Ref } from 'vue'
import type { Recipe } from '@/data-source/dto/recipe.dto'
import type { Item } from '@/data-source/dto/item.dto'
import { useItemsStore } from '@/stores/itemsStore'
import { useRecipesStore } from '@/stores/recipesStore'
import type { Point } from '@/data-source/dto/point.dto'

export const useNodesStore = defineStore('nodes', () => {
    const nodes: Ref<Node[]> = ref([])
    const selectedNode: Ref<Node | null> = ref(null)

    const itemsStore = useItemsStore()
    const recipesStore = useRecipesStore()
    let incrementId: number = 0

    const centerCanvas: Ref<Point> = ref({ x: 0, y: 0 })

    function addNode(item: Item): void {
        nodes.value.push({
            id: incrementId++,
            name: item.name,
            coord: {
                x: centerCanvas.value.x - 24,
                y: centerCanvas.value.y - 24,
            },
            item: item,
            factor: 1,
            coefficient: 1,
        })
    }

    function removeNode(id: number): void {
        const index = nodes.value.findIndex((state) => state.id === id)

        if (index !== -1) {
            nodes.value.splice(index, 1)
        }
    }

    function updateNodeRecipe(id: number, recipe: Recipe | null): void {
        const state = nodes.value.find((s) => s.id === id)
        if (state) {
            state.recipe = recipe!
        }
    }

    function updateNodeVeins(id: number, veins: number): void {
        const state = nodes.value.find((s) => s.id === id)
        if (state) {
            state.factor = veins
        }
    }

    function updateNodeBuildingCount(id: number, buildingCount: number): void {
        const state = nodes.value.find((s) => s.id === id)
        if (state) {
            state.factor = buildingCount
        }
    }

    function updateNodeCoefficient(id: number, coefficient: number | undefined): void {
        const state = nodes.value.find((s) => s.id === id)
        if (state) {
            state.coefficient = coefficient === undefined ? 1 : coefficient
        }
    }

    function updateNodePosition(id: number, x: number, y: number): void {
        const state = nodes.value.find((s) => s.id === id)
        if (state) {
            state.coord.x = x
            state.coord.y = y
        }
    }

    function updateCanvasPosition(point: Point) {
        centerCanvas.value = point
    }

    const allNodes = computed(() => nodes.value)
    const center = computed(() => centerCanvas.value)

    return {
        selectedNode,

        addNode,
        removeNode,
        updateNodeRecipe,
        updateNodeVeins,
        updateNodeBuildingCount,
        updateNodeCoefficient,
        updateNodePosition,
        updateCanvasPosition,

        allNodes,
        center,
    }
})
