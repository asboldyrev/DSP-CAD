import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue'
import type { Item } from '@/types/Item'
import type { Recipe } from '@/types/Recipe'
import type { Node } from '@/types/Node'
import type { Connection } from '@/types/Connection'
import type { NodeState } from '@/types/NodeState'
// Import the improved graph structure and calculation state types.  Adjust
// this import path as needed when integrating into the main codebase.
import { ProductionGraph } from '@/core/productionGraph'
import type { NodeCalcState, ConnectionCalcState } from '@/core/types'
// Reference store provides dictionary lookups for items and recipes.
import { useReferenceStore } from './referenceStore'

/**
 * A Pinia store that wraps the `ProductionGraph` class to manage nodes and
 * connections.  It exposes reactive proxies for nodes and computed
 * connections suitable for consumption by Vue components.  Connection
 * coordinates are derived from the current node positions, eliminating the
 * need to store and update them separately.  Mutation methods delegate to
 * the underlying graph instance and update state accordingly.
 */
export const useGraphStore = defineStore('graph', () => {
  // Access to normalised reference data
  const referenceStore = useReferenceStore()
  // Underlying graph instance.  Wrapped in `reactive` so that Vue will
  // track property reads (although most state is encapsulated in Maps).
  const graph = reactive(new ProductionGraph())
  // Cache mapping node id to its reactive proxy.  A plain object is used
  // because Vue can track deletions and additions on objects more easily than
  // on Map instances.
  const nodeCache: Record<number, Node> = {}

  /**
   * Return a reactive proxy for the given calculation state.  If a proxy
   * already exists for the state's id it will be reused.  The proxy
   * exposes getters and setters that read and write directly from the
   * underlying `NodeCalcState`.  Computed properties resolve the item and
   * recipe definitions using the reference store and provide a `name`
   * convenience property.  Vue tracks accesses to these computed refs so
   * UI components update automatically when dictionary entries change.
   */
  function getProxyForState(state: NodeCalcState): Node {
    const existing = nodeCache[state.id]
    if (existing) return existing
    // Computed references to dictionary entries
    const itemRef = computed(() => referenceStore.getItemById(state.itemId).value as Item | undefined)
    const recipeRef = computed(() => {
      const rid = state.recipeId
      if (rid) {
        return referenceStore.getRecipeById(rid).value as Recipe | undefined
      }
      return undefined
    })
    const nameRef = computed(() => itemRef.value?.name ?? '')
    // Build the proxy with reactive getters/setters
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
      }
    } as unknown as Node
    // Make the proxy reactive so Vue tracks property accesses
    const reactiveProxy = reactive(proxy) as unknown as Node
    nodeCache[state.id] = reactiveProxy
    return reactiveProxy
  }

  /**
   * Return all node proxies.  Cleans up the cache by removing proxies that
   * no longer correspond to any state entry.  This mirrors the behaviour of
   * the original nodes store.
   */
  function getNodes(): Node[] {
    const states = graph.getAllNodeStates()
    const currentIds = new Set(states.map((s) => s.id))
    Object.keys(nodeCache).forEach((idStr) => {
      const id = Number(idStr)
      if (!currentIds.has(id)) {
        delete nodeCache[id]
      }
    })
    return states.map((state) => getProxyForState(state))
  }

  /**
   * Add a new node.  Accepts an object containing the id, coordinates and
   * selected item.  A default coefficient of 1 is set if undefined.  This
   * delegates to the underlying graph and creates adjacency lists.  Note
   * that the caller is responsible for ensuring unique node identifiers.
   */
  function addNode(newNode: { id: number; x: number; y: number; item: Item }): void {
    graph.addNode({
      id: newNode.id,
      x: newNode.x,
      y: newNode.y,
      itemId: newNode.item.id,
      coefficient: 1
    })
  }

  /**
   * Remove a node by id along with all associated connections.
   */
  function removeNode(id: number): void {
    graph.removeNode(id)
  }

  /**
   * Update the recipe assigned to a node.  Passing null clears the recipe.
   */
  function updateNodeRecipe(id: number, recipe: Recipe | null): void {
    graph.updateNodeState(id, { recipeId: recipe?.id })
  }

  /**
   * Update the veins value for a node.
   */
  function updateNodeVeins(id: number, veins: number): void {
    graph.updateNodeState(id, { veins })
  }

  /**
   * Update the buildingCount for a node.
   */
  function updateNodeBuildingCount(id: number, buildingCount: number): void {
    graph.updateNodeState(id, { buildingCount })
  }

  /**
   * Update the productivity coefficient for a node.  Passing undefined
   * resets the coefficient to 1.
   */
  function updateNodeCoefficient(id: number, coefficient: number | undefined): void {
    graph.updateNodeState(id, { coefficient })
  }

  /**
   * Update the position of a node.  Delegates to the graph.  Because
   * connection coordinates are derived from node positions, there is no
   * separate update of connection data required.
   */
  function updateNodePosition(id: number, x: number, y: number): void {
    graph.updateNodePosition(id, x, y)
  }

  /**
   * Computed list of connections.  Each entry resolves belt and sorter
   * identifiers into actual Item instances and derives coordinates from
   * current node positions.  The resulting objects should be treated as
   * read‑only; use update methods to modify state.
   */
  const connections = computed<Connection[]>(() => {
    const states = graph.getAllConnectionStates()
    return states.map((conn: ConnectionCalcState) => {
      const fromNode = graph.getNode(conn.fromNodeId)
      const toNode = graph.getNode(conn.toNodeId)
      return {
        id: conn.id,
        fromNodeId: conn.fromNodeId,
        toNodeId: conn.toNodeId,
        fromX: fromNode?.x ?? 0,
        fromY: fromNode?.y ?? 0,
        toX: toNode?.x ?? 0,
        toY: toNode?.y ?? 0,
        belt: conn.beltId ? referenceStore.getItemById(conn.beltId).value : undefined,
        inputSorter: conn.inputSorterId ? referenceStore.getItemById(conn.inputSorterId).value : undefined,
        outputSorter: conn.outputSorterId ? referenceStore.getItemById(conn.outputSorterId).value : undefined,
        syncSorters: conn.syncSorters,
        selectedResource: conn.selectedResource
      } as Connection
    })
  })

  /**
   * Retrieve both incoming and outgoing connections for a node.  Returns a
   * computed ref so that changes in the graph automatically update the
   * dependent UI.
   */
  function getConnectionsForNode(nodeId: number) {
    return computed(() => {
      const conns: Connection[] = []
      graph.getConnectionsForNode(nodeId).forEach((cs) => {
        // Use existing computed to map to the UI representation
        const full = connections.value.find((c) => c.id === cs.id)
        if (full) conns.push(full)
      })
      return conns
    })
  }

  /**
   * Retrieve outgoing connections for a node.
   */
  function getOutgoingConnections(nodeId: number) {
    return computed(() => {
      const result: Connection[] = []
      graph.getOutgoingConnections(nodeId).forEach((cid) => {
        const full = connections.value.find((c) => c.id === cid)
        if (full) result.push(full)
      })
      return result
    })
  }

  /**
   * Retrieve incoming connections for a node.
   */
  function getIncomingConnections(nodeId: number) {
    return computed(() => {
      const result: Connection[] = []
      graph.getIncomingConnections(nodeId).forEach((cid) => {
        const full = connections.value.find((c) => c.id === cid)
        if (full) result.push(full)
      })
      return result
    })
  }

  /**
   * Add a new connection between two nodes.  Accepts optional belt and
   * sorter selections via their Item objects.  Duplicate connections are
   * ignored by the underlying graph.  Returns the id of the connection or
   * undefined if creation failed (e.g. nodes do not exist or duplicate).
   */
  function createConnection(fromNodeId: number, toNodeId: number, options?: {
    belt?: Item | null
    inputSorter?: Item | null
    outputSorter?: Item | null
    syncSorters?: boolean
    selectedResource?: string
  }): number | undefined {
    return graph.addConnection(fromNodeId, toNodeId, {
      beltId: options?.belt?.id,
      inputSorterId: options?.inputSorter?.id,
      outputSorterId: options?.outputSorter?.id,
      syncSorters: options?.syncSorters,
      selectedResource: options?.selectedResource
    })
  }

  /**
   * Remove a connection by id.
   */
  function deleteConnection(connectionId: number): void {
    graph.removeConnection(connectionId)
  }

  /**
   * Remove all connections attached to the given node id.
   */
  function deleteConnectionsForNode(nodeId: number): void {
    // Collect all connection ids first to avoid modifying the adjacency
    // lists while iterating over them.
    const incoming = graph.getIncomingConnections(nodeId)
    const outgoing = graph.getOutgoingConnections(nodeId)
    incoming.forEach((cid) => graph.removeConnection(cid))
    outgoing.forEach((cid) => graph.removeConnection(cid))
  }

  /**
   * Update the selected belt for a connection.  Passing null clears the belt.
   */
  function updateConnectionBelt(connectionId: number, belt: Item | null): void {
    graph.updateConnection(connectionId, { beltId: belt ? belt.id : undefined })
  }

  /**
   * Update the input sorter for a connection.  Passing null clears the sorter.
   * When sorters are synchronised the output sorter will also be updated.
   */
  function updateConnectionInputSorter(connectionId: number, sorter: Item | null): void {
    graph.updateConnection(connectionId, { inputSorterId: sorter ? sorter.id : undefined })
  }

  /**
   * Update the output sorter for a connection.  Passing null clears the sorter.
   * When sorters are synchronised the input sorter will also be updated.
   */
  function updateConnectionOutputSorter(connectionId: number, sorter: Item | null): void {
    graph.updateConnection(connectionId, { outputSorterId: sorter ? sorter.id : undefined })
  }

  /**
   * Update whether the input and output sorters stay in sync.  When enabled
   * the input and output sorter ids will be kept equal.
   */
  function updateConnectionSyncSorters(connectionId: number, syncSorters: boolean): void {
    graph.updateConnection(connectionId, { syncSorters })
  }

  /**
   * Update the selected resource for a connection.  This determines which
   * output resource will be transmitted when the source produces multiple
   * outputs.
   */
  function updateConnectionSelectedResource(connectionId: number, resourceId: string): void {
    graph.updateConnection(connectionId, { selectedResource: resourceId })
  }

  // Transient UI state used when the user is interactively creating a new
  // connection on the canvas.  This mirrors the behaviour of the original
  // connections store.
  const connectionState = ref({
    isCreatingConnection: false,
    selectedNodeId: null as number | null
  })

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
    const first = connectionState.value.selectedNodeId
    if (first === null) {
      // First node selected
      connectionState.value.selectedNodeId = nodeId
    } else if (first === nodeId) {
      // Clicking the same node deselects it
      connectionState.value.selectedNodeId = null
    } else {
      // Second node selected – create the connection
      createConnection(first, nodeId)
      connectionState.value.isCreatingConnection = false
      connectionState.value.selectedNodeId = null
    }
  }

  /**
   * Computed accessor for whether a connection is currently being created.
   */
  const isCreatingConnection = computed(() => connectionState.value.isCreatingConnection)
  /**
   * Computed accessor for the id of the selected node during connection
   * creation.
   */
  const selectedNodeId = computed(() => connectionState.value.selectedNodeId)

  return {
    // Accessors
    getNodes,
    connections,
    getConnectionsForNode,
    getOutgoingConnections,
    getIncomingConnections,
    isCreatingConnection,
    selectedNodeId,
    // Node mutation
    addNode,
    removeNode,
    updateNodeRecipe,
    updateNodeVeins,
    updateNodeBuildingCount,
    updateNodeCoefficient,
    updateNodePosition,
    // Connection mutation
    createConnection,
    deleteConnection,
    deleteConnectionsForNode,
    updateConnectionBelt,
    updateConnectionInputSorter,
    updateConnectionOutputSorter,
    updateConnectionSyncSorters,
    updateConnectionSelectedResource,
    // UI state actions
    startCreatingConnection,
    cancelCreatingConnection,
    selectNodeForConnection
  }
})
