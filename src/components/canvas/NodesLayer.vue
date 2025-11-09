<template>
    <g class="nodes">
        <NodeComponent v-for="n in nodes" :key="n.id" :node="n" />
    </g>
</template>

<script setup lang="ts">
    import { storeToRefs } from 'pinia'
    import { useNodesStore } from '@/stores/nodesStore'
    import NodeComponent from '@/components/canvas/NodeComponent.vue'
    const { allNodes: nodes } = storeToRefs(useNodesStore())
</script>

<style scoped>
    :deep(.nodes .node rect) {
        filter: drop-shadow(0 1px 1px rgba(30, 41, 59, 0.06));
    }
</style>
