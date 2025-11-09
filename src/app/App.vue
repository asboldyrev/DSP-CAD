<script setup lang="ts">
  import D3Canvas from '@/components/canvas/D3Canvas.vue';
  import SidebarFrame from '@/components/SidebarFrame.vue';
  import { useNodesStore } from '@/stores/nodesStore';
  import { computed, defineAsyncComponent, ref, watch } from 'vue';

  // id цели для заголовка (важно прокинуть в дочерние панели)
  const headerTargetId = 'sidebar-header-target'

  const nodesStore = useNodesStore()

  // Регистр панелей (ленивая загрузка)
  const panes = {
    BuildingSelector: defineAsyncComponent(() => import('@/components/Sidebar/BuildingSelector.vue')),
    Edit: defineAsyncComponent(() => import('@/components/Sidebar/BuildingEdit.vue')),
  } as const

  type PaneKey = keyof typeof panes
  const activeKey = ref<PaneKey>('BuildingSelector')
  const ActivePane = computed(() => panes[activeKey.value])

  function switchPane(key: PaneKey) {
    activeKey.value = key
  }

  watch(() => nodesStore.selectedNode, (to) => {
    if (to) {
      switchPane('Edit')
    } else {
      switchPane('BuildingSelector')
    }
  })

</script>

<template>
  <div class="app">
    <header class="app-header">
      <img src="/favicon.png" class="favicon">
      <h1>DSP CAD</h1>
    </header>
    <main class="app-main">
      <div class="app-canvas">
        <D3Canvas />
      </div>
      <div class="app-sidebar">
        <SidebarFrame :header-target-id="headerTargetId">
          <component :is="ActivePane" :header-target-id="headerTargetId" />
        </SidebarFrame>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
  .app {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;

    &-header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 600;
        line-height: 2rem;
      }

      p {
        margin: 0;
        opacity: 0.9;
        font-size: 1rem;
      }
    }
  }

  .app-main {
    display: flex;
    justify-content: stretch;
    align-items: stretch;
    width: 100%;
    height: 100%;
    flex: 1;
    overflow: hidden;
  }

  .app-canvas {
    width: 100%;
  }

  .app-sidebar {
    width: 500px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .favicon {
    height: 44px;
    border-radius: 15%;
  }
</style>
