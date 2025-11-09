import * as d3 from 'd3'
import { defineStore } from 'pinia'
import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'

export const useCanvasStore = defineStore('canvas', () => {
    // UI
    const zoom: Ref<number> = ref(1)
    const showGrid: Ref<boolean> = ref(true)
    const isCreatingConnection: Ref<boolean> = ref(false)

    // Viewport size (screen px)
    const viewW = ref(800)
    const viewH = ref(600)

    // D3 runtime (как данные, без функций)
    const currentTransform: ShallowRef<d3.ZoomTransform> = shallowRef(d3.zoomIdentity)
    const zoomBehavior: ShallowRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null> =
        shallowRef(null)
    const dragBehavior: ShallowRef<d3.DragBehavior<Element, unknown, unknown> | null> =
        shallowRef(null)

    // Drag state
    const isDragging: Ref<boolean> = ref(false)

    // DOM elements
    const svgEl: ShallowRef<SVGSVGElement | null> = shallowRef(null)
    const viewportEl: ShallowRef<SVGGElement | null> = shallowRef(null)

    return {
        // state only
        zoom,
        showGrid,
        isCreatingConnection,
        viewW,
        viewH,
        currentTransform,
        zoomBehavior,
        dragBehavior,
        isDragging,
        svgEl,
        viewportEl,
    }
})
