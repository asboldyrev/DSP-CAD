<template>
    <g class="node" :class="{ 'node-selected': isSelected }" :data-node-id="node.id" :title="`${node.item.name} (${node.x.toFixed(0)}, ${node.y.toFixed(0)})`">
        <rect :x="node.x - 32" :y="node.y - 32" width="64" height="64" rx="8" ry="8" :fill="isSelected ? '#dbeafe' : 'white'" :stroke="isSelected ? '#3b82f6' : '#8aa0b4'" :stroke-width="isSelected ? '2.5' : '1.5'" />
        <foreignObject :x="node.x - 24" :y="node.y - 24" width="48" height="48">
            <GameIcon :id="node.item.id" :size="48" />
        </foreignObject>
        <!-- Иконка рецепта внизу справа -->
        <foreignObject v-if="node.recipe" :x="node.x + 16" :y="node.y + 16" width="24" height="24">
            <GameIcon :key="`recipe-${node.id}-${node.recipe.id}`" :id="node.recipe.id" :size="24" />
        </foreignObject>

        <!-- Производительность под нодой -->
        <text v-if="productionResult.rate > 0" :x="node.x" :y="node.y + 50" text-anchor="middle" class="production-text">
            {{ productionResult.rate.toFixed(productionResult.inputPrecision || 1) }} {{ productionResult.unit }}
        </text>
    </g>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import type { Node } from '@/types/Node'
    import GameIcon from './GameIcon.vue'
    import { ProductionCalculator } from '@/utils/ProductionCalculator'

    interface Props {
        node: Node
        isSelected?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        isSelected: false
    })

    // Расчет производительности с использованием калькулятора
    const productionResult = computed(() => {
        return ProductionCalculator.calculateProduction(props.node)
    })
</script>

<style scoped>
    .production-text {
        font-size: 10px;
        font-weight: 500;
        fill: #10b981;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }
</style>