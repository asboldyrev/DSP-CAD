import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Connection } from '@/domain/types/Connection'
import type { ConnectionData } from '@/domain/types/ConnectionData'
import type { Node } from '@/domain/types/Node'
import type { Item } from '@/data-source/dto/item.dto'
import { useItemsStore } from './itemsStore'

export const useConnectionsStore = defineStore('connections', () => {
    const connectionData = ref<ConnectionData[]>([])

    const connectionState = ref({
        isCreatingConnection: false,
        selectedNodeId: null as number | null,
    })

    let nextConnectionId = 1

    const itemsStore = useItemsStore()

    const connections = computed<Connection[]>(() => {
        return connectionData.value.map((cd) => {
            const belt = cd.beltId ? itemsStore.getItemById(cd.beltId) : undefined
            const inputSorter = cd.inputSorterId
                ? itemsStore.getItemById(cd.inputSorterId)
                : undefined
            const outputSorter = cd.outputSorterId
                ? itemsStore.getItemById(cd.outputSorterId)
                : undefined

            return {
                id: cd.id,
                fromNodeId: cd.fromNodeId,
                toNodeId: cd.toNodeId,
                fromX: cd.fromX,
                fromY: cd.fromY,
                toX: cd.toX,
                toY: cd.toY,
                belt: belt,
                inputSorter: inputSorter,
                outputSorter: outputSorter,
                syncSorters: cd.syncSorters,
                selectedResource: cd.selectedResource,
            } as Connection
        })
    })

    function getConnectionsForNode(nodeId: number) {
        return computed(() => {
            return connections.value.filter(
                (conn) => conn.fromNodeId === nodeId || conn.toNodeId === nodeId,
            )
        })
    }

    function getOutgoingConnections(nodeId: number) {
        return computed(() => {
            return connections.value.filter((conn) => conn.fromNodeId === nodeId)
        })
    }

    function getIncomingConnections(nodeId: number) {
        return computed(() => {
            return connections.value.filter((conn) => conn.toNodeId === nodeId)
        })
    }

    function startCreatingConnection() {
        connectionState.value.isCreatingConnection = true
        connectionState.value.selectedNodeId = null
    }

    function cancelCreatingConnection() {
        connectionState.value.isCreatingConnection = false
        connectionState.value.selectedNodeId = null
    }

    function selectNodeForConnection(nodeId: number, nodes: Node[]): void {
        if (!connectionState.value.isCreatingConnection) return

        const node = nodes.find((n) => n.id === nodeId)
        if (!node) return

        if (connectionState.value.selectedNodeId === null) {
            // First node selected
            connectionState.value.selectedNodeId = nodeId
        } else if (connectionState.value.selectedNodeId === nodeId) {
            // Clicking the same node deselects it
            connectionState.value.selectedNodeId = null
        } else {
            // Second node selected – create the connection
            createConnection(connectionState.value.selectedNodeId, nodeId, nodes)
            connectionState.value.isCreatingConnection = false
            connectionState.value.selectedNodeId = null
        }
    }

    function createConnection(fromNodeId: number, toNodeId: number, nodes: Node[]): void {
        const fromNode = nodes.find((n) => n.id === fromNodeId)
        const toNode = nodes.find((n) => n.id === toNodeId)
        if (!fromNode || !toNode) return

        const existing = connectionData.value.find(
            (conn) => conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId,
        )
        if (existing) return

        const newConnection: ConnectionData = {
            id: nextConnectionId++,
            fromNodeId,
            toNodeId,
            fromX: fromNode.x,
            fromY: fromNode.y,
            toX: toNode.x,
            toY: toNode.y,
            syncSorters: true,
        }
        connectionData.value.push(newConnection)
    }

    function updateConnectionCoordinates(nodeId: number, x: number, y: number): void {
        connectionData.value.forEach((conn) => {
            if (conn.fromNodeId === nodeId) {
                conn.fromX = x
                conn.fromY = y
            }
            if (conn.toNodeId === nodeId) {
                conn.toX = x
                conn.toY = y
            }
        })
    }

    function deleteConnection(connectionId: number): void {
        const index = connectionData.value.findIndex((conn) => conn.id === connectionId)
        if (index !== -1) {
            connectionData.value.splice(index, 1)
        }
    }

    function deleteConnectionsForNode(nodeId: number): void {
        connectionData.value = connectionData.value.filter(
            (conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId,
        )
    }

    function updateConnectionBelt(connectionId: number, belt: Item | null): void {
        const conn = connectionData.value.find((c) => c.id === connectionId)
        if (conn) {
            conn.beltId = belt ? belt.id : undefined
        }
    }

    function updateConnectionInputSorter(connectionId: number, sorter: Item | null): void {
        const conn = connectionData.value.find((c) => c.id === connectionId)
        if (conn) {
            conn.inputSorterId = sorter ? sorter.id : undefined
            // If sorters are synced, update the output sorter as well
            if (conn.syncSorters) {
                conn.outputSorterId = sorter ? sorter.id : undefined
            }
        }
    }

    function updateConnectionOutputSorter(connectionId: number, sorter: Item | null): void {
        const conn = connectionData.value.find((c) => c.id === connectionId)
        if (conn) {
            conn.outputSorterId = sorter ? sorter.id : undefined
            // If sorters are synced, update the input sorter as well
            if (conn.syncSorters) {
                conn.inputSorterId = sorter ? sorter.id : undefined
            }
        }
    }

    function updateConnectionSyncSorters(connectionId: number, syncSorters: boolean): void {
        const conn = connectionData.value.find((c) => c.id === connectionId)
        if (conn) {
            conn.syncSorters = syncSorters
            if (syncSorters) {
                // Force both sorters to the same id (preferring input)
                const sorterId = conn.inputSorterId || conn.outputSorterId
                conn.inputSorterId = sorterId
                conn.outputSorterId = sorterId
            }
        }
    }

    function updateConnectionSelectedResource(connectionId: number, resourceId: string): void {
        const conn = connectionData.value.find((c) => c.id === connectionId)
        if (conn) {
            conn.selectedResource = resourceId
        }
    }

    const isCreatingConnection = computed(() => connectionState.value.isCreatingConnection)
    const selectedNodeId = computed(() => connectionState.value.selectedNodeId)

    return {
        // State
        connections,
        isCreatingConnection,
        selectedNodeId,
        // Computed helpers
        getConnectionsForNode,
        getOutgoingConnections,
        getIncomingConnections,
        // UI state actions
        startCreatingConnection,
        cancelCreatingConnection,
        selectNodeForConnection,
        // Data mutations
        createConnection,
        updateConnectionCoordinates,
        deleteConnection,
        deleteConnectionsForNode,
        updateConnectionBelt,
        updateConnectionInputSorter,
        updateConnectionOutputSorter,
        updateConnectionSyncSorters,
        updateConnectionSelectedResource,
    }
})
