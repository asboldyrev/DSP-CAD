<script setup lang="ts">
  import D3Canvas from './components/D3Canvas.vue'
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
      <D3Canvas />
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
      flex: 1;
      overflow: hidden;
    }

    &__favicon {
      height: 44px;
      border-radius: 15%;
    }
  }
</style>
