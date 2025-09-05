import type { Node } from '@/types/Node'
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

    function getNodes() {
        return nodes.value
    }

    return {addNode, removeNode, getNodes}
})