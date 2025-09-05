<template>
    <g class="node" :data-node-id="node.id" :title="`${node.item.name} (${node.x.toFixed(0)}, ${node.y.toFixed(0)})`">
        <rect :x="node.x - 32" :y="node.y - 32" width="64" height="64" rx="8" ry="8" fill="white" stroke="#8aa0b4" stroke-width="1.5" />
        <foreignObject :x="node.x - 24" :y="node.y - 24" width="48" height="48">
            <GameIcon :id="node.item.id" :size="48" />
        </foreignObject>
    </g>
</template>

<script setup lang="ts">
    import type { Node } from '@/types/Node'
    import GameIcon from './GameIcon.vue'

    interface Props {
        node: Node
    }

    defineProps<Props>()
</script>

<style scoped>
    /* Стили для ноды можно добавить здесь, если потребуется */
</style>