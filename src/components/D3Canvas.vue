<template>
    <div class="d3-canvas-container">
        <div class="canvas-controls">
            <button @click="resetView" class="control-btn">Сброс</button>
            <button @click="toggleGrid" class="control-btn">
                {{ showGrid ? 'Скрыть сетку' : 'Показать сетку' }}
            </button>
            <button @click="addNode" class="control-btn">Добавить ноду</button>
            <div class="zoom-info">Масштаб: {{ Math.round(zoomLevel * 100) }}%</div>
        </div>

        <div ref="canvasContainer" class="canvas-container">
            <svg ref="svgRef" class="d3-canvas">
                <defs>
                    <pattern :id="patternId" patternUnits="userSpaceOnUse" :width="grid.step" :height="grid.step">
                        <circle :r="grid.dotRadius" :cx="grid.dotOffset" :cy="grid.dotOffset" :fill="grid.dotColor" />
                    </pattern>
                </defs>

                <!-- ЕДИНАЯ зум-сцена: и сетка, и ноды -->
                <g ref="viewportRef">
                    <rect v-if="showGrid" class="grid-overlay" :fill="`url(#${patternId})`" :width="view.w * 10" :height="view.h * 10" :x="-view.w * 4.5" :y="-view.h * 4.5" />

                    <g class="nodes">
                        <g v-for="node in nodes" :key="node.id" class="node" :data-node-id="node.id">
                            <rect :x="node.x - 60" :y="node.y - 28" width="120" height="56" rx="8" ry="8" fill="white" stroke="#8aa0b4" stroke-width="1.5" />
                            <text :x="node.x" :y="node.y + 4" text-anchor="middle" font-size="12" fill="#334">
                                {{ node.name }}: {{ node.x.toFixed(0) }}x{{ node.y.toFixed(0) }}
                            </text>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
    import * as d3 from 'd3'
    import { useNodesStore } from '@/stores/nodes'

    /** Refs + состояние */
    const canvasContainer = ref<HTMLElement>()
    const svgRef = ref<SVGSVGElement>()
    const viewportRef = ref<SVGGElement>()
    const showGrid = ref(true)
    const zoomLevel = ref(1)

    /** Store */
    const nodesStore = useNodesStore()
    const nodes = computed(() => nodesStore.getNodes())

    /** Viewport size */
    const view = reactive({ w: 800, h: 600 })

    /** Grid params */
    const grid = reactive({
        step: 20,
        dotRadius: 1.2,
        dotOffset: 1.2,
        dotColor: '#c8d2db'
    })
    const patternId = `dot-grid-${Math.random().toString(36).slice(2)}`

    /** D3 runtime */
    let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
    let dragBehavior: d3.DragBehavior<Element, unknown, unknown> | null = null
    let currentTransform: d3.ZoomTransform = d3.zoomIdentity

    function measure() {
        const el = canvasContainer.value
        const svg = svgRef.value
        if (!el || !svg) return
        const rect = el.getBoundingClientRect()
        view.w = Math.max(300, Math.floor(rect.width))
        view.h = Math.max(200, Math.floor(rect.height))
        svg.setAttribute('width', String(view.w))
        svg.setAttribute('height', String(view.h))
    }

    function initZoom() {
        if (!svgRef.value || !viewportRef.value) return
        const svg = d3.select(svgRef.value)
        const viewport = d3.select(viewportRef.value)

        zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 10])
            .filter((event) => {
                // колёсико, ЛКМ без модификаторов
                if (event.type === 'wheel') return true
                if (event.type === 'mousedown') return (event as MouseEvent).button === 0
                return true
            })
            .on('zoom', (event) => {
                currentTransform = event.transform
                zoomLevel.value = currentTransform.k
                viewport.attr('transform', currentTransform.toString())
            })

        svg.call(zoomBehavior as any)
    }

    function initDrag() {
        if (!svgRef.value) return
        const svgNode = svgRef.value

        dragBehavior = d3.drag<Element, unknown>()
            .on('start', (event) => {
                event.sourceEvent.stopPropagation() // чтобы при начале перетаскивания не стартовал pan
            })
            .on('drag', (event) => {
                const targetNode = (event.sourceEvent.target as Element)?.closest('.node') as SVGGElement | null
                if (!targetNode) return
                const nodeId = parseInt(targetNode.getAttribute('data-node-id') || '0', 10)
                const node = nodes.value.find(n => n.id === nodeId)
                if (!node) return

                // координаты указателя внутри SVG
                const [px, py] = d3.pointer(event.sourceEvent, svgNode)
                // переводим в координаты сцены через инверсию текущего зума
                const [sx, sy] = currentTransform.invert([px, py])

                node.x = sx
                node.y = sy
            })

        // навесим drag на все ноды
        bindDragToNodes()
    }

    function bindDragToNodes() {
        if (!svgRef.value || !dragBehavior) return
        const svg = d3.select(svgRef.value)
        svg.selectAll<SVGGElement, unknown>('.node').call(dragBehavior as any)
    }

    function resetView() {
        if (!svgRef.value || !zoomBehavior) return
        d3.select(svgRef.value)
            .transition().duration(300)
            .call(zoomBehavior.transform as any, d3.zoomIdentity)
    }

    function toggleGrid() {
        showGrid.value = !showGrid.value
    }

    function addNode() {
        const newNode = {
            id: Date.now(),
            name: `Node ${nodes.value.length + 1}`,
            x: 0,
            y: 0
        }
        // ставим в центр текущего экрана (в координатах сцены)
        const cx = view.w / 2
        const cy = view.h / 2
        const [sx, sy] = currentTransform.invert([cx, cy])
        newNode.x = sx
        newNode.y = sy
        nodesStore.addNode(newNode)
    }

    onMounted(() => {
        measure()
        initZoom()
        initDrag()

        // re-bind drag при любом изменении набора нод (добавление/удаление)
        watch(
            () => nodes.value.map(n => n.id),
            async () => {
                await nextTick()
                bindDragToNodes()
            },
            { deep: false }
        )

        const ro = new ResizeObserver(() => measure())
        if (canvasContainer.value) ro.observe(canvasContainer.value)
        onUnmounted(() => ro.disconnect())
    })

    onUnmounted(() => {
        // при необходимости — отписки
    })
</script>

<style scoped>
    .d3-canvas-container {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .canvas-controls {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        align-items: center;
    }

    .control-btn {
        padding: 0.5rem 1rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }

    .control-btn:hover {
        background: #0056b3;
    }

    .zoom-info {
        margin-left: auto;
        font-size: 14px;
        color: #666;
        font-weight: 500;
    }

    .canvas-container {
        flex: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border: 1px solid #ddd;
        background: #f8fafc;
    }

    .d3-canvas {
        display: block;
        width: 100%;
        height: 100%;
    }

    /* лёгкая тень под блоками */
    :deep(.nodes .node rect) {
        filter: drop-shadow(0 1px 1px rgba(30, 41, 59, 0.06));
    }
</style>