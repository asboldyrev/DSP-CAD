<template>
    <div class="d3-canvas-container">
        <div class="canvas-container" @click="onCanvasClick" @mousemove="onMouseMove">
            <UiContainer />

            <svg ref="svgRef" class="d3-canvas">
                <!-- defs должны быть в корне svg -->
                <MarkersDefs />
                <GridDefs />

                <!-- ВСЁ, что должно зумиться/паниться — внутри группы -->
                <g ref="viewportRef">
                    <GridMesh />
                    <NodesLayer />
                    <!-- <ConnectionsLayer /> -->
                </g>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
    import * as d3 from 'd3'
    import { ref, onMounted, onUnmounted } from 'vue'
    import { useCanvasStore } from '@/stores/canvasStore'
    import UiContainer from './UiContainer.vue'
    import GridDefs from '@/components/canvas/GridDefs.vue'
    import GridMesh from '@/components/canvas/GridMesh.vue'
    import MarkersDefs from '@/components/canvas/MarkersDefs.vue'
    import NodesLayer from '@/components/canvas/NodesLayer.vue'
    import { useNodesStore } from '@/stores/nodesStore'

    const canvas = useCanvasStore()
    const nodesStore = useNodesStore()

    const svgRef = ref<SVGSVGElement>()
    const viewportRef = ref<SVGGElement>()
    let resizeObs: ResizeObserver | null = null

    /** ---- D3 INIT (оставляем в корневом компоненте) ---- */
    function initZoom() {
        if (!svgRef.value || !viewportRef.value) return
        canvas.svgEl = svgRef.value
        canvas.viewportEl = viewportRef.value

        const svg = d3.select(svgRef.value)
        const viewport = d3.select(viewportRef.value)

        const zb = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 10])
            .filter((event) => {
                if (event.type === 'wheel') return true
                if (event.type === 'mousedown') return (event as MouseEvent).button === 0
                return true
            })
            .on('zoom', (event) => {
                const t = event.transform as d3.ZoomTransform
                viewport.attr('transform', t.toString())
                canvas.currentTransform = t
                canvas.zoom = t.k
            })

        svg.call(zb as any)
        canvas.zoomBehavior = zb
    }

    function initResizeObserver() {
        if (!svgRef.value) return
        const host = svgRef.value.parentElement! // .canvas-container
        resizeObs = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect
            canvas.viewW = Math.max(300, Math.floor(cr.width))
            canvas.viewH = Math.max(200, Math.floor(cr.height))
        })
        resizeObs.observe(host)
    }

    function onMouseMove() {
        const svg = canvas.svgEl
        if (!svg) return

        const rect = svg.getBoundingClientRect()
        const x = (rect.width / 2) - 24
        const y = (rect.height / 2) - 24
        const [sx, sy] = canvas.currentTransform.invert([x, y])

        nodesStore.updateCanvasPosition({ x: sx, y: sy })
    }

    function onCanvasClick(_e: MouseEvent) {
        nodesStore.selectedNode = null
    }

    onMounted(() => {
        initZoom()
        initResizeObserver()
    })

    onUnmounted(() => {
        resizeObs?.disconnect()
    })
</script>

<style scoped>
    .d3-canvas-container {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .canvas-container {
        position: relative;
        flex: 1;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border: 1px solid #ddd;
        background: #f8fafc;
    }

    .d3-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        z-index: 1;
    }
</style>
