/**
 * NodeState describes the minimal state required to represent a node on the
 * canvas and to perform throughput and production calculations. It does not
 * embed full dictionary objects (items/recipes) but instead references them by
 * identifier.  Additional runtime properties like x/y coordinates and
 * quantities live on this type.  A node's productivity may be scaled using
 * the optional `coefficient` field – a value of 1 means no adjustment while
 * values greater or less than 1 scale production and consumption up or down.
 */
export interface NodeState {
  /**
   * Unique identifier for the node on the canvas.  This value should not
   * collide with any other node's id.
   */
  id: number
  /**
   * Horizontal position of the node in canvas space.
   */
  x: number
  /**
   * Vertical position of the node in canvas space.
   */
  y: number
  /**
   * Identifier of the building represented by this node.  Use
   * itemsStore.getItemById to obtain the full Item definition.
   */
  itemId: string
  /**
   * Identifier of the recipe assigned to this node.  Use
   * recipesStore.getRecipeById to obtain the full Recipe definition.  When
   * undefined the node has no recipe (e.g. a newly placed building).
   */
  recipeId?: string
  /**
   * Number of veins (ore patches) for miners or direct production rate for
   * extractors.  Only relevant for producers.
   */
  veins?: number
  /**
   * Number of parallel buildings for processors.  Allows the user to
   * effectively scale production by building multiple of the same machine.
   */
  buildingCount?: number
  /**
   * Productivity coefficient applied to the node.  Multiplying base
   * production and consumption by this value allows users to simulate
   * productivity upgrades or slowdowns.  When undefined it is treated as 1.
   */
  coefficient?: number
}
