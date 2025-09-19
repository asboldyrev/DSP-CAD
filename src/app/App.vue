<script setup lang="ts">
  import D3Canvas from '@/components/D3Canvas.vue';
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
      <div class="app-sidebar">2</div>
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
    width: 400px;
  }

  .favicon {
    height: 44px;
    border-radius: 15%;
  }
</style>
