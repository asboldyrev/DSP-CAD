

// -----------------------------------------------------------------------------
// Example usage
//
// The code below illustrates how the above classes might be used.  It is not
// executed by default and serves purely as documentation.
/*
async function example() {
  // 1. Load reference JSON (in a real application, fetch from server)
  const rawItems: Item[] = await fetch('/data/Items/buildings.json').then((r) => r.json())
  const rawRecipes: Recipe[] = await fetch('/data/recipes.json').then((r) => r.json())
  // 2. Build dictionaries
  const dicts = new Dictionaries()
  dicts.loadItems(rawItems)
  dicts.loadRecipes(rawRecipes)
  // 3. Create a production graph and add nodes
  const graph = new ProductionGraph()
  graph.addNode({ id: 1, x: 0, y: 0, itemId: 'mining-machine', recipeId: 'iron-ore', veins: 6 })
  graph.addNode({ id: 2, x: 10, y: 0, itemId: 'smelter', recipeId: 'iron-ingot', buildingCount: 2 })
  // 4. Connect nodes
  graph.addConnection(1, 2, { beltId: 'conveyor-belt-1' })
  // 5. Retrieve connections for a node efficiently
  const node1Conns = graph.getOutgoingConnections(1)
  console.log('Node 1 outgoing connections:', node1Conns)
  // 6. Fetch item and recipe definitions in O(1)
  const item = dicts.getItem('mining-machine')
  const recipe = dicts.getRecipe('iron-ore')
  console.log(item, recipe)
}
*/
