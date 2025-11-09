<template>
    <div class="canvas-hud">
        <div class="zoom-info">Масштаб: {{ Math.round(canvas.zoom * 100) }}%</div>

        <button class="hud-btn" @click="resetView">
            <i class="ri-loop-right-line"></i>
        </button>

        <button class="control-btn" :title="canvas.showGrid ? 'Скрыть сетку' : 'Показать сетку'" @click="canvas.showGrid = !canvas.showGrid">
            <i v-show="canvas.showGrid" class="ri-eye-line"></i>
            <i v-show="!canvas.showGrid" class="ri-eye-off-line"></i>
        </button>
    </div>
</template>

<script setup lang="ts">
    import * as d3 from 'd3'
    import { useCanvasStore } from '@/stores/canvasStore'

    const canvas = useCanvasStore()

    function resetView() {
        if (!canvas.svgEl || !canvas.zoomBehavior) return
        d3.select(canvas.svgEl)
            .transition()
            .duration(300)
            .call(canvas.zoomBehavior.transform as any, d3.zoomIdentity)
    }
</script>

<style scoped>
    .canvas-hud {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
    }

    .canvas-hud .zoom-info,
    .hud-btn,
    .control-btn {
        pointer-events: auto;
        position: absolute;
    }

    .canvas-hud .zoom-info {
        top: 12px;
        right: 60px;
        padding: 6px 10px;
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
        background: rgba(255, 255, 255, .85);
        border: 1px solid rgba(0, 0, 0, .08);
        border-radius: 8px;
        backdrop-filter: saturate(1.2) blur(2px);
    }

    .hud-btn {
        top: 12px;
        right: 12px;
        padding: 6px 10px;
        font-weight: 600;
    }

    .control-btn {
        top: 12px;
        left: 12px;
        padding: .5rem 1rem;
        background: #007bff;
        color: #fff;
        border: 0;
        border-radius: 4px;
    }

    .control-btn:hover {
        background: #0056b3;
    }
</style>
