/**
 * ConnectionData stores the minimal state for a connection between two nodes.
 * It references belts and sorters by their identifier rather than embedding
 * full Item objects.  This separation ensures that dictionary data (items,
 * recipes) remains independent from the visualization state.  Use the
 * connectionsStore getters to obtain a fully resolved Connection with
 * Item instances.
 */
export interface ConnectionData {
  /** Unique identifier for the connection. */
  id: number
  /** Identifier of the source node. */
  fromNodeId: number
  /** Identifier of the target node. */
  toNodeId: number
  /** X coordinate of the source node at the time the connection was created. */
  fromX: number
  /** Y coordinate of the source node at the time the connection was created. */
  fromY: number
  /** X coordinate of the target node at the time the connection was created. */
  toX: number
  /** Y coordinate of the target node at the time the connection was created. */
  toY: number
  /** Identifier of the selected belt item.  When undefined the belt does not
   * limit the throughput. */
  beltId?: string
  /** Identifier of the selected input sorter item.  When undefined the sorter
   * does not limit the throughput on the input side. */
  inputSorterId?: string
  /** Identifier of the selected output sorter item.  When undefined the sorter
   * does not limit the throughput on the output side. */
  outputSorterId?: string
  /** Whether the input and output sorters should automatically stay in sync.
   * When true, adjusting one sorter updates the other to the same value. */
  syncSorters: boolean
  /** Identifier of the resource chosen for this connection when the source
   * produces multiple outputs.  When undefined the default resource is used
   * (first output or inferred from the destination's input). */
  selectedResource?: string
}