import type { ConnectionCalcState, NodeCalcState } from "@/core/types"

/**
 * A graph structure that stores nodes and connections using Maps and
 * adjacency lists.  It provides efficient methods for adding, updating and
 * deleting nodes and connections, as well as retrieving incoming/outgoing
 * connections in O(1) time.
 */
export class ProductionGraph {
    // Stores node calculation state keyed by node ID
    private readonly nodes: Map<number, NodeCalcState> = new Map()
    // Stores connection calculation state keyed by connection ID
    private readonly connections: Map<number, ConnectionCalcState> = new Map()
    // Adjacency lists
    private readonly outgoing: Map<number, Set<number>> = new Map()
    private readonly incoming: Map<number, Set<number>> = new Map()
    // Auto‑incrementing IDs for new connections
    private nextConnectionId = 1

    /**
     * Add a new node to the graph.  If a node with the same ID already exists,
     * it will be overwritten.
     */
    addNode(state: Omit<NodeCalcState, 'coefficient'> & { coefficient?: number }): void {
      // Normalise coefficient: undefined -> 1
      const coefficient = state.coefficient ?? 1
      const node: NodeCalcState = { ...state, coefficient }
      this.nodes.set(node.id, node)
      // Initialise adjacency lists
      if (!this.outgoing.has(node.id)) this.outgoing.set(node.id, new Set())
      if (!this.incoming.has(node.id)) this.incoming.set(node.id, new Set())
    }

    /**
     * Remove a node and all associated connections.
     */
    removeNode(nodeId: number): void {
      // Remove all outgoing connections
      const out = this.outgoing.get(nodeId)
      if (out) {
        for (const connId of Array.from(out)) {
          this.removeConnection(connId)
        }
      }
      // Remove all incoming connections
      const inc = this.incoming.get(nodeId)
      if (inc) {
        for (const connId of Array.from(inc)) {
          this.removeConnection(connId)
        }
      }
      // Delete node and adjacency lists
      this.nodes.delete(nodeId)
      this.outgoing.delete(nodeId)
      this.incoming.delete(nodeId)
    }

    /**
     * Update a node's position.  Only x and y coordinates are changed; other
     * properties remain untouched.
     */
    updateNodePosition(nodeId: number, x: number, y: number): void {
      const node = this.nodes.get(nodeId)
      if (node) {
        node.x = x
        node.y = y
      }
    }

    /**
     * Update mutable fields of a node (recipe, veins, buildingCount,
     * coefficient).  Missing fields are ignored.
     */
    updateNodeState(nodeId: number, fields: Partial<Omit<NodeCalcState, 'id' | 'x' | 'y' | 'itemId'>>): void {
      const node = this.nodes.get(nodeId)
      if (node) {
        if (fields.recipeId !== undefined) node.recipeId = fields.recipeId
        if (fields.veins !== undefined) node.veins = fields.veins
        if (fields.buildingCount !== undefined) node.buildingCount = fields.buildingCount
        if (fields.coefficient !== undefined) node.coefficient = fields.coefficient
      }
    }

    /**
     * Retrieve a node by ID.  Returns undefined if it does not exist.
     */
    getNode(nodeId: number): NodeCalcState | undefined {
      return this.nodes.get(nodeId)
    }

    /**
     * Add a new connection between two nodes.  Returns the assigned ID.  If
     * either node does not exist or a connection with the same endpoints
     * already exists, the method aborts and returns undefined.
     */
    addConnection(fromNodeId: number, toNodeId: number, options: Omit<ConnectionCalcState, 'id' | 'fromNodeId' | 'toNodeId'> = {}): number | undefined {
      if (!this.nodes.has(fromNodeId) || !this.nodes.has(toNodeId)) {
        return undefined
      }
      // Check for duplicate
      for (const connId of this.outgoing.get(fromNodeId) ?? []) {
        const existing = this.connections.get(connId)
        if (existing && existing.toNodeId === toNodeId) {
          return undefined
        }
      }
      const id = this.nextConnectionId++
      const conn: ConnectionCalcState = {
        id,
        fromNodeId,
        toNodeId,
        beltId: options.beltId,
        inputSorterId: options.inputSorterId,
        outputSorterId: options.outputSorterId,
        syncSorters: options.syncSorters ?? true,
        selectedResource: options.selectedResource
      }
      this.connections.set(id, conn)
      // Update adjacency lists
      if (!this.outgoing.has(fromNodeId)) this.outgoing.set(fromNodeId, new Set())
      if (!this.incoming.has(toNodeId)) this.incoming.set(toNodeId, new Set())
      this.outgoing.get(fromNodeId)!.add(id)
      this.incoming.get(toNodeId)!.add(id)
      return id
    }

    /**
     * Remove a connection by ID.  Also removes it from the adjacency lists.
     */
    removeConnection(connectionId: number): void {
      const conn = this.connections.get(connectionId)
      if (!conn) return
      this.connections.delete(connectionId)
      this.outgoing.get(conn.fromNodeId)?.delete(connectionId)
      this.incoming.get(conn.toNodeId)?.delete(connectionId)
    }

    /**
     * Update connection properties (belt, sorters, selected resource, sync flag).
     */
    updateConnection(connectionId: number, fields: Partial<Omit<ConnectionCalcState, 'id' | 'fromNodeId' | 'toNodeId'>>): void {
      const conn = this.connections.get(connectionId)
      if (!conn) return
      if (fields.beltId !== undefined) conn.beltId = fields.beltId
      if (fields.inputSorterId !== undefined) conn.inputSorterId = fields.inputSorterId
      if (fields.outputSorterId !== undefined) conn.outputSorterId = fields.outputSorterId
      if (fields.selectedResource !== undefined) conn.selectedResource = fields.selectedResource
      if (fields.syncSorters !== undefined) {
        conn.syncSorters = fields.syncSorters
        if (conn.syncSorters) {
          // Synchronise sorters: prefer input
          const sorterId = conn.inputSorterId ?? conn.outputSorterId
          conn.inputSorterId = sorterId
          conn.outputSorterId = sorterId
        }
      }
    }

    /**
     * Retrieve all outgoing connection IDs from the given node.
     */
    getOutgoingConnections(nodeId: number): number[] {
      return Array.from(this.outgoing.get(nodeId) ?? [])
    }

    /**
     * Retrieve all incoming connection IDs to the given node.
     */
    getIncomingConnections(nodeId: number): number[] {
      return Array.from(this.incoming.get(nodeId) ?? [])
    }

    /**
     * Retrieve full connection objects for a node (both incoming and outgoing).
     */
    getConnectionsForNode(nodeId: number): ConnectionCalcState[] {
      const incoming = this.getIncomingConnections(nodeId)
      const outgoing = this.getOutgoingConnections(nodeId)
      const result: ConnectionCalcState[] = []
      for (const id of incoming) {
        const conn = this.connections.get(id)
        if (conn) result.push(conn)
      }
      for (const id of outgoing) {
        const conn = this.connections.get(id)
        if (conn) result.push(conn)
      }
      return result
    }
  }
