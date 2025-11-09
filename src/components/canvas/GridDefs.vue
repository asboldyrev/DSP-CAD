<template>
    <defs>
        <pattern :id="patternId" patternUnits="userSpaceOnUse" :width="grid.step" :height="grid.step">
            <circle :r="grid.dotRadius" :cx="grid.dotOffset" :cy="grid.dotOffset" :fill="grid.dotColor" />
        </pattern>
    </defs>
</template>

<script setup lang="ts">
    import { reactive } from 'vue'
    const grid = reactive({ step: 20, dotRadius: 1.2, dotOffset: 1.2, dotColor: '#c8d2db' })
    const patternId = 'dot-grid' // важно: стабильно такое же id, как в GridMesh
</script>
