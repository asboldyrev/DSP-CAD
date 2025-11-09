<template>
    <g ref="nodeRef" class="node" :class="{ 'node-selected': isSelected, 'node-dragging': isDragging }" :data-node-id="node.id" :title="`${node.item.name} (${node.coord.x.toFixed(0)}, ${node.coord.y.toFixed(0)})`" @click="handleClick">
        <rect :x="node.coord.x - 32" :y="node.coord.y - 32" width="64" height="64" rx="8" ry="8" :fill="isSelected ? '#dbeafe' : 'white'" :stroke="isSelected ? '#3b82f6' : '#8aa0b4'" :stroke-width="isSelected ? '2.5' : '1.5'" />
        <foreignObject :x="node.coord.x - 24" :y="node.coord.y - 24" width="48" height="48">
            <GameIcon :id="node.item.id" :size="48" />
        </foreignObject>
        <!-- Иконка рецепта внизу справа -->
        <foreignObject v-if="node.recipe" :x="node.coord.x + 16" :y="node.coord.y + 16" width="24" height="24">
            <GameIcon :key="`recipe-${node.id}-${node.recipe.id}`" :id="node.recipe.id" :size="24" />
        </foreignObject>

        <!-- Количество жил для майнеров в правом верхнем углу -->
        <text v-if="producersStore.isMiner(node.item.id) && node.factor && node.factor > 1" :x="node.coord.x + 28" :y="node.coord.y - 20" text-anchor="middle" class="veins-count-text">
            {{ node.factor }} жил
        </text>

        <!-- Количество строений в левом верхнем углу -->
        <text v-else-if="node.factor && node.factor > 1" :x="node.coord.x - 28" :y="node.coord.y - 20" text-anchor="middle" class="building-count-text">
            {{ node.factor }}x
        </text>

        <!-- Производительность под нодой -->
        <text v-if="productionResult.rate > 0 || (node.recipe && ProductionCalculator.isProcessor(node))" :x="node.x" :y="node.y + 50" text-anchor="middle" class="production-text">
            {{ productionResult.rate.toFixed(productionResult.inputPrecision || 2) }} {{ productionResult.unit }}
        </text>
    </g>
</template>

<script setup lang="ts">
    import * as d3 from 'd3'
    import type { Node } from '@/data-source/dto/node.dto'
    import { useNodesStore } from '@/stores/nodesStore';
    import { useCanvasStore } from '@/stores/canvasStore';
    import { computed, ref, onMounted, onUnmounted, type Ref } from 'vue';
    import GameIcon from '@/components/GameIcon.vue'
    import { useProducersStore } from '@/stores/producersStore';

    interface Props {
        node: Node
        //     allConnections?: Connection[]
        //     allNodes?: Node[]
    }

    const props = defineProps<Props>()

    const nodesStore = useNodesStore()
    const canvasStore = useCanvasStore()
    const producersStore = useProducersStore()


    const nodeRef = ref<SVGGElement>()
    const isDragging = ref(false)


    // Расчет производительности с использованием калькулятора
    // const productionResult = computed(() => {

    //     // Для процессоров учитываем входные ресурсы
    //     if (props.allConnections && props.allNodes && ProductionCalculator.isProcessor(props.node)) {
    //         const actualRate = InputResourceCalculator.calculateActualProductionRate(
    //             props.node,
    //             props.allConnections,
    //             props.allNodes
    //         )
    //         const baseResult = ProductionCalculator.calculateProduction(props.node)
    //         return {
    //             ...baseResult,
    //             rate: actualRate
    //         }
    //     }

    //     // Для майнеров используем обычный расчет
    //     return ProductionCalculator.calculateProduction(props.node)
    // })

    function handleClick(event: MouseEvent) {
        event.stopPropagation()
        nodesStore.selectedNode = props.node
    }

    const isSelected = computed(() => {
        return nodesStore.selectedNode?.id === props.node.id
    })

    // Drag functionality
    function initDrag() {
        if (!nodeRef.value) return

        const drag = d3.drag<SVGGElement, unknown>()
            .filter((event) => {
                // Разрешаем drag только левой кнопкой мыши
                return event.type === 'mousedown' && (event as MouseEvent).button === 0
            })
            .on('start', (event) => {
                isDragging.value = true
                canvasStore.isDragging = true
                // Предотвращаем zoom при drag
                if (canvasStore.zoomBehavior) {
                    canvasStore.zoomBehavior.filter((e) => {
                        return e.type !== 'mousedown' || (e as MouseEvent).button !== 0
                    })
                }
            })
            .on('drag', (event) => {
                // координаты указателя внутри SVG
                const [px, py] = d3.pointer(event.sourceEvent, canvasStore.svgEl)
                // переводим в координаты сцены через инверсию текущего зума
                const [sx, sy] = canvasStore.currentTransform.invert([px, py])

                // Update position via the store so that state remains consistent
                nodesStore.updateNodePosition(props.node.id, sx, sy)
            })
            .on('end', () => {
                isDragging.value = false
                canvasStore.isDragging = false
                // Восстанавливаем zoom behavior
                if (canvasStore.zoomBehavior) {
                    canvasStore.zoomBehavior.filter((event) => {
                        if (event.type === 'wheel') return true
                        if (event.type === 'mousedown') return (event as MouseEvent).button === 0
                        return true
                    })
                }
            })

        d3.select(nodeRef.value).call(drag as any)
    }

    onMounted(() => {
        initDrag()
    })
</script>

<style scoped>
    .node {
        cursor: pointer;
    }

    .node-dragging {
        cursor: grabbing;
    }

    .node-dragging rect {
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

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
