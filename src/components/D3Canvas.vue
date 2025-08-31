<template>
    <div class="d3-canvas-container">
        <div class="canvas-controls">
            <button @click="resetView" class="control-btn">Сброс</button>
            <button @click="toggleGrid" class="control-btn">{{ showGrid ? 'Скрыть сетку' : 'Показать сетку' }}</button>
            <div class="zoom-info">
                Масштаб: {{ Math.round(zoomLevel * 100) }}%
            </div>
        </div>
        <div ref="canvasContainer" class="canvas-container">
            <svg ref="svgRef" class="d3-canvas">
                <defs>
                    <!-- Повторяемый паттерн точек для сетки -->
                    <pattern :id="patternId" patternUnits="userSpaceOnUse" :width="grid.step" :height="grid.step">
                        <!-- точка сетки -->
                        <circle :r="grid.dotRadius" :cx="grid.dotOffset" :cy="grid.dotOffset" :fill="grid.dotColor" />
                    </pattern>
                </defs>

                <!-- Зумируемая сцена (включая сетку) -->
                <g ref="sceneRef">
                    <!-- Сетка внутри сцены для масштабирования -->
                    <rect v-if="showGrid" class="grid-overlay" :fill="`url(#${patternId})`" :width="view.w * 10" :height="view.h * 10" :x="-view.w * 4.5" :y="-view.h * 4.5" />

                    <!-- Демонстрационные рёбра -->
                    <!-- <g class="edges">
                        <line x1="200" y1="160" x2="520" y2="360" stroke="#5b7c99" stroke-width="2" opacity="0.8" />
                        <line x1="400" y1="100" x2="300" y2="400" stroke="#5b7c99" stroke-width="2" opacity="0.8" />
                    </g> -->

                    <!-- Демонстрационные узлы -->
                    <!-- <g class="nodes">
                        <g class="node">
                            <rect x="140" y="132" width="120" height="56" rx="8" ry="8" fill="white" stroke="#8aa0b4" stroke-width="1.5" />
                            <text x="200" y="164" text-anchor="middle" font-size="12" fill="#334">
                                Node A
                            </text>
                        </g>
                        <g class="node">
                            <rect x="460" y="332" width="120" height="56" rx="8" ry="8" fill="white" stroke="#8aa0b4" stroke-width="1.5" />
                            <text x="520" y="364" text-anchor="middle" font-size="12" fill="#334">
                                Node B
                            </text>
                        </g>
                        <g class="node">
                            <rect x="340" y="72" width="120" height="56" rx="8" ry="8" fill="white" stroke="#8aa0b4" stroke-width="1.5" />
                            <text x="400" y="104" text-anchor="middle" font-size="12" fill="#334">
                                Node C
                            </text>
                        </g>
                        <g class="node">
                            <rect x="240" y="372" width="120" height="56" rx="8" ry="8" fill="white" stroke="#8aa0b4" stroke-width="1.5" />
                            <text x="300" y="404" text-anchor="middle" font-size="12" fill="#334">
                                Node D
                            </text>
                        </g>
                    </g> -->
                </g>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, onUnmounted, reactive } from 'vue'
    import * as d3 from 'd3'

    // Состояние компонента
    const canvasContainer = ref<HTMLElement>()
    const svgRef = ref<SVGSVGElement>()
    const sceneRef = ref<SVGGElement>()
    const showGrid = ref(true)
    const zoomLevel = ref(1)

    // Размеры вьюпорта
    const view = reactive({ w: 800, h: 600 })

    // Параметры сетки (точек)
    const grid = reactive({
        step: 20,                // шаг сетки в px экрана
        dotRadius: 1.2,          // радиус точки
        dotOffset: 1.2,          // отступ точки внутри клетки
        dotColor: '#c8d2db'      // цвет точки
    })

    // Идентификатор паттерна (на случай нескольких холстов на странице)
    const patternId = `dot-grid-${Math.random().toString(36).slice(2)}`

    // D3 переменные
    let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
    let currentTransform: d3.ZoomTransform = d3.zoomIdentity

    // Пересчитать размеры при ресайзе контейнера
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

    // Инициализация D3
    const initD3 = () => {
        if (!svgRef.value || !sceneRef.value) return

        const svg = d3.select(svgRef.value)
        const scene = d3.select(sceneRef.value)

        // Инициализация зума/панорамирования
        zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 10])          // лимиты масштаба
            .filter((event) => {
                // Разрешаем колесо/drag ЛКМ, запрещаем зум при нажатых модификаторах
                if (event.type === 'wheel') return true
                if (event.type === 'mousedown') return (event as MouseEvent).button === 0
                return true
            })
            .on('zoom', (event) => {
                currentTransform = event.transform
                zoomLevel.value = event.transform.k

                // Применяем трансформ ко всей сцене (включая сетку)
                scene.attr('transform', currentTransform.toString())
            })

        svg.call(zoomBehavior)
    }

    // Сброс вида
    const resetView = () => {
        if (!svgRef.value || !zoomBehavior) return

        const svg = d3.select(svgRef.value)
        svg.transition().duration(750).call(
            zoomBehavior.transform,
            d3.zoomIdentity
        )
    }

    // Переключение сетки
    const toggleGrid = () => {
        showGrid.value = !showGrid.value
    }

    // Жизненный цикл
    onMounted(() => {
        measure()
        initD3()

        // Ресайз наблюдатель
        const ro = new ResizeObserver(() => measure())
        if (canvasContainer.value) {
            ro.observe(canvasContainer.value)
        }

        onUnmounted(() => ro.disconnect())
    })

    onUnmounted(() => {
        // очистка обработчиков, если нужно
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

    /* SVG-холст */
    .d3-canvas {
        display: block;
        width: 100%;
        height: 100%;
    }

    /* Стили для сетки */
    .grid-overlay {
        /* сетка внутри сцены для масштабирования */
    }

    /* Стили для демонстрационных элементов */
    :deep(.nodes .node rect) {
        filter: drop-shadow(0 1px 1px rgba(30, 41, 59, 0.06));
    }

    :deep(.edges line) {
        color: #5b7c99;
    }
</style>