import type { Node } from '@/types/Node'
import type { Recipe } from '@/types/Recipes'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNodesStore = defineStore('nodes', () => {
    const nodes = ref<Node[]>([])

    function addNode(node: Node): void {
        nodes.value.push(node)
    }

    function removeNode(id: number) {
        const index = nodes.value.findIndex(node => node.id === id)
        if (index !== -1) {
            nodes.value.splice(index, 1)
        }
    }

    function updateNodeRecipe(id: number, recipe: Recipe | null) {
        const node = nodes.value.find(node => node.id === id)
        if (node) {
            node.recipe = recipe || undefined
        }
    }

    function updateNodeVeins(id: number, veins: number) {
        const node = nodes.value.find(node => node.id === id)
        if (node) {
            node.veins = veins
        }
    }

    function getNodes() {
        return nodes.value
    }

    return {addNode, removeNode, updateNodeRecipe, updateNodeVeins, getNodes}
})