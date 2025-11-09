<template>
    <rect v-if="canvas.showGrid" class="grid-overlay" fill="url(#dot-grid)" :width="canvas.viewW * 10" :height="canvas.viewH * 10" :x="-canvas.viewW * 4.5" :y="-canvas.viewH * 4.5" />
</template>

<script setup lang="ts">
    import { useCanvasStore } from '@/stores/canvasStore'
    const canvas = useCanvasStore()
</script>
