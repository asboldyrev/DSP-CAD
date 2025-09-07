import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Connection } from '@/types/Connection'
import type { ConnectionData } from '@/types/ConnectionData'
import type { Node } from '@/types/Node'
import type { Item } from '@/types/Item'
import { useItemsStore } from './itemsStore'

/**
 * Store managing connections between nodes.  The raw state consists of
 * ConnectionData entries that reference belts and sorters via their
 * identifiers.  A computed getter resolves these identifiers into full
 * Item objects for consumption by the UI and calculators.  Connection
 * creation, deletion and updates operate on the underlying ConnectionData
 * array.  The store also tracks transient state used when the user is
 * interactively creating a new connection on the canvas.
 */
export const useConnectionsStore = defineStore('connections', () => {
  // Underlying array of connection state entries
  const connectionData = ref<ConnectionData[]>([])

  // Transient UI state for connection creation
  const connectionState = ref({
    isCreatingConnection: false,
    selectedNodeId: null as number | null
  })

  // Auto-incrementing id for new connections
  let nextConnectionId = 1

  // Access to item dictionary for resolving belt and sorter ids
  const itemsStore = useItemsStore()

  /**
   * Resolves ConnectionData entries into full Connection objects.  The
   * resulting objects are not meant to be mutated directly; use the
   * provided update methods to modify state instead.  This getter maps
   * beltId, inputSorterId and outputSorterId to Item instances via
   * itemsStore.getItemById.
   */
  const connections = computed<Connection[]>(() => {
    return connectionData.value.map((cd) => {
      const belt = cd.beltId ? itemsStore.getItemById(cd.beltId) : undefined
      const inputSorter = cd.inputSorterId ? itemsStore.getItemById(cd.inputSorterId) : undefined
      const outputSorter = cd.outputSorterId ? itemsStore.getItemById(cd.outputSorterId) : undefined
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
        selectedResource: cd.selectedResource
      } as Connection
    })
  })

  /**
   * Returns incoming and outgoing connections for a given node id.
   */
  function getConnectionsForNode(nodeId: number) {
    return computed(() => {
      return connections.value.filter((conn) => conn.fromNodeId === nodeId || conn.toNodeId === nodeId)
    })
  }

  /**
   * Returns outgoing connections for a given node id.
   */
  function getOutgoingConnections(nodeId: number) {
    return computed(() => {
      return connections.value.filter((conn) => conn.fromNodeId === nodeId)
    })
  }

  /**
   * Returns incoming connections for a given node id.
   */
  function getIncomingConnections(nodeId: number) {
    return computed(() => {
      return connections.value.filter((conn) => conn.toNodeId === nodeId)
    })
  }

  /**
   * Begin interactive connection creation.  Sets the transient state so that
   * subsequent node selections can build a connection.
   */
  function startCreatingConnection() {
    connectionState.value.isCreatingConnection = true
    connectionState.value.selectedNodeId = null
  }

  /**
   * Cancel connection creation.  Resets transient state.
   */
  function cancelCreatingConnection() {
    connectionState.value.isCreatingConnection = false
    connectionState.value.selectedNodeId = null
  }

  /**
   * Handle node selection during interactive connection creation.  If a
   * first node has not been selected yet, store the given node id.  If a
   * first node has already been selected and a different node is clicked,
   * create a connection between the two nodes.  Clicking on the same node
   * again will deselect it.
   */
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

  /**
   * Create a new connection between two nodes.  Uses the nodes array to
   * determine the initial coordinates.  Prevents duplicate connections.
   */
  function createConnection(fromNodeId: number, toNodeId: number, nodes: Node[]): void {
    const fromNode = nodes.find((n) => n.id === fromNodeId)
    const toNode = nodes.find((n) => n.id === toNodeId)
    if (!fromNode || !toNode) return

    // Check for existing connection with same endpoints
    const existing = connectionData.value.find((conn) => conn.fromNodeId === fromNodeId && conn.toNodeId === toNodeId)
    if (existing) return

    const newConnection: ConnectionData = {
      id: nextConnectionId++,
      fromNodeId,
      toNodeId,
      fromX: fromNode.x,
      fromY: fromNode.y,
      toX: toNode.x,
      toY: toNode.y,
      syncSorters: true
    }
    connectionData.value.push(newConnection)
  }

  /**
   * Update the coordinates of connections when a node moves.  Called by
   * watchers in D3Canvas when node positions change.
   */
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

  /**
   * Remove a connection by id.
   */
  function deleteConnection(connectionId: number): void {
    const index = connectionData.value.findIndex((conn) => conn.id === connectionId)
    if (index !== -1) {
      connectionData.value.splice(index, 1)
    }
  }

  /**
   * Remove all connections attached to the given node id.
   */
  function deleteConnectionsForNode(nodeId: number): void {
    connectionData.value = connectionData.value.filter((conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId)
  }

  /**
   * Update the selected belt for a connection.  Passing null clears the belt.
   */
  function updateConnectionBelt(connectionId: number, belt: Item | null): void {
    const conn = connectionData.value.find((c) => c.id === connectionId)
    if (conn) {
      conn.beltId = belt ? belt.id : undefined
    }
  }

  /**
   * Update the input sorter for a connection.  Passing null clears the sorter.
   */
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

  /**
   * Update the output sorter for a connection.  Passing null clears the sorter.
   */
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

  /**
   * Update whether the input and output sorters stay in sync.  When enabled
   * the input and output sorter ids will be kept equal.
   */
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

  /**
   * Update the selected resource for a connection.  This determines which
   * output resource will be transmitted when the source produces multiple
   * outputs.
   */
  function updateConnectionSelectedResource(connectionId: number, resourceId: string): void {
    const conn = connectionData.value.find((c) => c.id === connectionId)
    if (conn) {
      conn.selectedResource = resourceId
    }
  }

  // Computed accessors for the transient creation state
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
    updateConnectionSelectedResource
  }
})