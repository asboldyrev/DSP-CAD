<template>
    <g class="node" :class="{ 'node-selected': isSelected }" :data-node-id="node.id" :title="`${node.item.name} (${node.x.toFixed(0)}, ${node.y.toFixed(0)})`" @click="handleClick">
        <rect :x="node.x - 32" :y="node.y - 32" width="64" height="64" rx="8" ry="8" :fill="isSelected ? '#dbeafe' : 'white'" :stroke="isSelected ? '#3b82f6' : '#8aa0b4'" :stroke-width="isSelected ? '2.5' : '1.5'" />
        <foreignObject :x="node.x - 24" :y="node.y - 24" width="48" height="48">
            <GameIcon :id="node.item.id" :size="48" />
        </foreignObject>
        <!-- Иконка рецепта внизу справа -->
        <foreignObject v-if="node.recipe" :x="node.x + 16" :y="node.y + 16" width="24" height="24">
            <GameIcon :key="`recipe-${node.id}-${node.recipe.id}`" :id="node.recipe.id" :size="24" />
        </foreignObject>

        <!-- Количество строений в левом верхнем углу -->
        <text v-if="node.buildingCount && node.buildingCount > 1" :x="node.x - 28" :y="node.y - 20" text-anchor="middle" class="building-count-text">
            {{ node.buildingCount }}x
        </text>

        <!-- Количество жил для майнеров в правом верхнем углу -->
        <text v-if="node.veins && node.veins > 1 && ProductionCalculator.isMiner(node.item.id)" :x="node.x + 28" :y="node.y - 20" text-anchor="middle" class="veins-count-text">
            {{ node.veins }} жил
        </text>

        <!-- Производительность под нодой -->
        <text v-if="productionResult.rate > 0 || (node.recipe && ProductionCalculator.isProcessor(node))" :x="node.x" :y="node.y + 50" text-anchor="middle" class="production-text">
            {{ productionResult.rate.toFixed(productionResult.inputPrecision || 1) }} {{ productionResult.unit }}
        </text>
    </g>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import type { Node } from '@/types/Node'
    import type { Connection } from '@/types/Connection'
    import GameIcon from './GameIcon.vue'
    import { ProductionCalculator } from '@/utils/ProductionCalculator'
    import { InputResourceCalculator } from '@/utils/InputResourceCalculator'

    interface Props {
        node: Node
        isSelected?: boolean
        allConnections?: Connection[]
        allNodes?: Node[]
    }

    interface Emits {
        (e: 'click', node: Node): void
    }

    const props = withDefaults(defineProps<Props>(), {
        isSelected: false
    })

    const emit = defineEmits<Emits>()

    // Расчет производительности с использованием калькулятора
    const productionResult = computed(() => {

        // Для процессоров учитываем входные ресурсы
        if (props.allConnections && props.allNodes && ProductionCalculator.isProcessor(props.node)) {
            const actualRate = InputResourceCalculator.calculateActualProductionRate(
                props.node,
                props.allConnections,
                props.allNodes
            )
            const baseResult = ProductionCalculator.calculateProduction(props.node)
            return {
                ...baseResult,
                rate: actualRate
            }
        }

        // Для майнеров используем обычный расчет
        return ProductionCalculator.calculateProduction(props.node)
    })

    function handleClick(event: MouseEvent) {
        event.stopPropagation()
        emit('click', props.node)
    }
</script>

<style scoped>
    .production-text {
        font-size: 10px;
        font-weight: 500;
        fill: #10b981;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .building-count-text {
        font-size: 12px;
        font-weight: 700;
        fill: #374151;
        text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
    }

    .veins-count-text {
        font-size: 11px;
        font-weight: 600;
        fill: #7c3aed;
        text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
    }
</style>