<script setup lang="ts">
  import { ref } from 'vue'
  import D3Canvas from './components/D3Canvas.vue'
  import BaseSidebar from './components/BaseSidebar.vue'
  import NodeEditPanel from './components/NodeEditPanel.vue'
  import ConnectionEditPanel from './components/ConnectionEditPanel.vue'
  import type { Node } from '@/types/Node'
  import type { Connection } from '@/types/Connection'
  import type { Recipe } from '@/types/Recipe'
  import type { Item } from '@/types/Item'
  import { useNodesStore } from '@/stores/nodes'
  import { useConnectionsStore } from '@/stores/connectionsStore'

  // Состояние для панелей
  const isNodePanelOpen = ref(false)
  const isConnectionPanelOpen = ref(false)
  const selectedNode = ref<Node | null>(null)
  const selectedConnection = ref<Connection | null>(null)

  // Stores
  const nodesStore = useNodesStore()
  const connectionsStore = useConnectionsStore()
  const nodes = nodesStore.getNodes()
  const connections = connectionsStore.connections

  // Обработчики для D3Canvas
  function handleNodeEdit(node: Node) {
    selectedNode.value = node
    selectedConnection.value = null
    isNodePanelOpen.value = true
    isConnectionPanelOpen.value = false
  }

  function handleConnectionEdit(connection: Connection) {
    selectedConnection.value = connection
    selectedNode.value = null
    isConnectionPanelOpen.value = true
    isNodePanelOpen.value = false
  }

  function closeNodePanel() {
    isNodePanelOpen.value = false
    selectedNode.value = null
  }

  function closeConnectionPanel() {
    isConnectionPanelOpen.value = false
    selectedConnection.value = null
  }

  // Обработчики для NodeEditPanel
  function handleNodeDelete(nodeId: number) {
    // Удаляем все связи для этой ноды
    connectionsStore.deleteConnectionsForNode(nodeId)
    // Удаляем саму ноду
    nodesStore.removeNode(nodeId)
    closeNodePanel()
  }

  function handleNodeUpdateRecipe(nodeId: number, recipe: Recipe | null) {
    nodesStore.updateNodeRecipe(nodeId, recipe)
  }

  function handleNodeUpdateVeins(nodeId: number, veins: number) {
    nodesStore.updateNodeVeins(nodeId, veins)
  }

  function handleNodeUpdateBuildingCount(nodeId: number, buildingCount: number) {
    nodesStore.updateNodeBuildingCount(nodeId, buildingCount)
  }

  function handleNodeUpdateCoefficient(nodeId: number, coefficient: number | undefined) {
    nodesStore.updateNodeCoefficient(nodeId, coefficient)
  }

  // Обработчики для ConnectionEditPanel
  function handleConnectionDelete(connectionId: number) {
    connectionsStore.deleteConnection(connectionId)
    closeConnectionPanel()
  }

  function handleConnectionUpdateBelt(connectionId: number, belt: Item | null) {
    connectionsStore.updateConnectionBelt(connectionId, belt)
  }

  function handleConnectionUpdateInputSorter(connectionId: number, sorter: Item | null) {
    connectionsStore.updateConnectionInputSorter(connectionId, sorter)
  }

  function handleConnectionUpdateOutputSorter(connectionId: number, sorter: Item | null) {
    connectionsStore.updateConnectionOutputSorter(connectionId, sorter)
  }

  function handleConnectionUpdateSyncSorters(connectionId: number, syncSorters: boolean) {
    connectionsStore.updateConnectionSyncSorters(connectionId, syncSorters)
  }

  function handleConnectionUpdateSelectedResource(connectionId: number, resourceId: string) {
    connectionsStore.updateConnectionSelectedResource(connectionId, resourceId)
  }
</script>

<template>
  <div class="app">
    <header class="app__header">
      <img
        src="/favicon.png"
        class="app__favicon"
      />
      <h1 class="app__title">DSP CAD</h1>
    </header>
    <main class="app__main">
      <D3Canvas
        @node-edit="handleNodeEdit"
        @connection-edit="handleConnectionEdit"
      />
      <BaseSidebar>
        <NodeEditPanel
          :is-open="isNodePanelOpen"
          :selected-node="selectedNode"
          :all-connections="connections"
          :all-nodes="nodes"
          @close="closeNodePanel"
          @delete="handleNodeDelete"
          @update-recipe="handleNodeUpdateRecipe"
          @update-veins="handleNodeUpdateVeins"
          @update-building-count="handleNodeUpdateBuildingCount"
          @update-coefficient="handleNodeUpdateCoefficient"
        />
        <ConnectionEditPanel
          :is-open="isConnectionPanelOpen"
          :selected-connection="selectedConnection"
          :nodes="nodes"
          :connections="connections"
          @close="closeConnectionPanel"
          @delete="handleConnectionDelete"
          @update-belt="handleConnectionUpdateBelt"
          @update-input-sorter="handleConnectionUpdateInputSorter"
          @update-output-sorter="handleConnectionUpdateOutputSorter"
          @update-sync-sorters="handleConnectionUpdateSyncSorters"
          @update-selected-resource="handleConnectionUpdateSelectedResource"
        />
      </BaseSidebar>
    </main>
  </div>
</template>

<style lang="scss" scoped>
  .app {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;

    &__header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    &__title {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
      line-height: 2rem;
    }

    &__main {
      display: flex;
      flex: 1;
      overflow: hidden;
      width: 100%;
      height: 100%;
    }

    &__favicon {
      height: 44px;
      border-radius: 15%;
    }
  }
</style>
