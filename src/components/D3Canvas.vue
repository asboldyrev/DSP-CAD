<template>
    <div class="d3-canvas-container">
        <div class="canvas-controls">
            <button @click="resetView" class="control-btn">Сброс</button>
            <button @click="toggleGrid" class="control-btn">
                {{ showGrid ? 'Скрыть сетку' : 'Показать сетку' }}
            </button>
            <button @click="openBuildingSelector" class="control-btn">Добавить строение</button>
            <button @click="toggleConnectionMode" class="control-btn" :class="{ 'active': isCreatingConnection, 'disabled': nodes.length < 2 }" :disabled="nodes.length < 2">
                {{ isCreatingConnection ? 'Отменить связь' : 'Добавить связь' }}
            </button>
            <div class="zoom-info">Масштаб: {{ Math.round(zoomLevel * 100) }}%</div>
        </div>

        <div ref="canvasContainer" class="canvas-container" @click="handleCanvasClick" @mousemove="handleMouseMove">
            <svg ref="svgRef" class="d3-canvas">
                <defs>
                    <pattern :id="patternId" patternUnits="userSpaceOnUse" :width="grid.step" :height="grid.step">
                        <circle :r="grid.dotRadius" :cx="grid.dotOffset" :cy="grid.dotOffset" :fill="grid.dotColor" />
                    </pattern>

                    <!-- Стрелки для связей -->
                    <marker id="arrowhead" markerWidth="16" markerHeight="12" refX="14" refY="6" orient="auto">
                        <polygon points="2 2, 14 6, 2 10" fill="#6b7280" stroke="#ffffff" stroke-width="1" />
                    </marker>
                    <marker id="arrowhead-selected" markerWidth="16" markerHeight="12" refX="14" refY="6" orient="auto">
                        <polygon points="2 2, 14 6, 2 10" fill="#3b82f6" stroke="#ffffff" stroke-width="1" />
                    </marker>

                    <!-- Динамические маркеры для разных цветов -->
                    <marker v-for="color in uniqueConnectionColors" :key="`arrowhead-${color}`" :id="`arrowhead-${color}`" markerWidth="16" markerHeight="12" refX="14" refY="6" orient="auto">
                        <polygon points="2 2, 14 6, 2 10" :fill="`#${color}`" stroke="#ffffff" stroke-width="1" />
                    </marker>
                    <marker v-for="color in uniqueConnectionColors" :key="`arrowhead-selected-${color}`" :id="`arrowhead-selected-${color}`" markerWidth="16" markerHeight="12" refX="14" refY="6" orient="auto">
                        <polygon points="2 2, 14 6, 2 10" :fill="`#${color}`" stroke="#ffffff" stroke-width="1" />
                    </marker>
                </defs>

                <!-- ЕДИНАЯ зум-сцена: и сетка, и ноды -->
                <g ref="viewportRef">
                    <rect v-if="showGrid" class="grid-overlay" :fill="`url(#${patternId})`" :width="view.w * 10" :height="view.h * 10" :x="-view.w * 4.5" :y="-view.h * 4.5" />

                    <!-- Связи (рисуются под нодами) -->
                    <g class="connections">
                        <ConnectionComponent v-for="connection in connections" :key="connection.id" :connection="connection" :is-selected="selectedConnection?.id === connection.id" @click="selectConnection" />

                        <!-- Предварительная связь при создании -->
                        <line v-if="isCreatingConnection && selectedNodeId && previewConnection" :x1="previewConnection.fromX" :y1="previewConnection.fromY" :x2="previewConnection.toX" :y2="previewConnection.toY" class="preview-connection" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrowhead-selected)" />
                    </g>

                    <g class="nodes">
                        <NodeComponent v-for="node in nodes" :key="node.id" :node="node" :is-selected="selectedNode?.id === node.id || (isCreatingConnection && selectedNodeId === node.id)" />
                    </g>
                </g>
            </svg>
        </div>

        <!-- Модальное окно выбора строений -->
        <BuildingSelectorModal :is-open="isBuildingSelectorOpen" @close="closeBuildingSelector" @select="addBuildingNode" />

        <!-- Панель редактирования ноды -->
        <NodeEditPanel :is-open="isEditPanelOpen" :selected-node="selectedNode" @close="closeEditPanel" @delete="deleteNode" @update-recipe="updateNodeRecipe" @update-veins="updateNodeVeins" />

        <!-- Панель редактирования связи -->
        <ConnectionEditPanel :is-open="isConnectionEditPanelOpen" :selected-connection="selectedConnection" :nodes="nodes" @close="closeConnectionEditPanel" @delete="deleteConnection" @update-belt="updateConnectionBelt" @update-input-sorter="updateConnectionInputSorter" @update-output-sorter="updateConnectionOutputSorter" @update-sync-sorters="updateConnectionSyncSorters" />
    </div>
</template>

<script setup lang="ts">
    import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
    import * as d3 from 'd3'
    import { useNodesStore } from '@/stores/nodes'
    import { useConnectionsStore } from '@/stores/connectionsStore'
    import BuildingSelectorModal from './BuildingSelectorModal.vue'
    import NodeComponent from './NodeComponent.vue'
    import NodeEditPanel from './NodeEditPanel.vue'
    import ConnectionComponent from './ConnectionComponent.vue'
    import ConnectionEditPanel from './ConnectionEditPanel.vue'
    import type { Item } from '@/types/Item'
    import type { Node } from '@/types/Node'
    import type { Recipe } from '@/types/Recipes'
    import type { Connection } from '@/types/Connection'

    /** Refs + состояние */
    const canvasContainer = ref<HTMLElement>()
    const svgRef = ref<SVGSVGElement>()
    const viewportRef = ref<SVGGElement>()
    const showGrid = ref(true)
    const zoomLevel = ref(1)
    const isBuildingSelectorOpen = ref(false)
    const isEditPanelOpen = ref(false)
    const isConnectionEditPanelOpen = ref(false)
    const selectedNode = ref<Node | null>(null)
    const selectedConnection = ref<Connection | null>(null)
    const mousePosition = ref({ x: 0, y: 0 })

    /** Store */
    const nodesStore = useNodesStore()
    const connectionsStore = useConnectionsStore()
    const nodes = computed(() => nodesStore.getNodes())
    const connections = computed(() => connectionsStore.connections)
    const isCreatingConnection = computed(() => connectionsStore.isCreatingConnection)
    const selectedNodeId = computed(() => connectionsStore.selectedNodeId)

    // Предварительная связь для отображения при создании
    const previewConnection = computed(() => {
        if (!isCreatingConnection.value || !selectedNodeId.value) return null

        const selectedNode = nodes.value.find(n => n.id === selectedNodeId.value)
        if (!selectedNode) return null

        return {
            fromX: selectedNode.x,
            fromY: selectedNode.y,
            toX: mousePosition.value.x,
            toY: mousePosition.value.y
        }
    })

    // Получаем уникальные цвета связей для создания маркеров
    const uniqueConnectionColors = computed(() => {
        const colors = new Set<string>()

        connections.value.forEach(conn => {
            if (conn.belt?.icon?.color) {
                // Получаем цвет из поля color иконки
                const iconColor = conn.belt.icon.color

                // Если цвет уже в формате hex, убираем #
                if (iconColor.startsWith('#')) {
                    colors.add(iconColor.replace('#', ''))
                } else if (iconColor.startsWith('rgb')) {
                    // Если цвет в формате rgb/rgba, конвертируем в hex
                    const rgbMatch = iconColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
                    if (rgbMatch) {
                        const [, r, g, b] = rgbMatch
                        const hexColor = `${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`
                        colors.add(hexColor)
                    }
                } else {
                    // Fallback к предопределенным цветам по ID
                    const beltColors: Record<string, string> = {
                        'conveyor-belt-1': '8b5cf6',
                        'conveyor-belt-2': '06b6d4',
                        'conveyor-belt-3': '10b981'
                    }
                    const color = beltColors[conn.belt.id]
                    if (color) colors.add(color)
                }
            }
        })

        // Добавляем стандартные цвета
        colors.add('6b7280') // default
        colors.add('4b5563') // hover
        colors.add('3b82f6') // selected
        colors.add('10b981') // highlighted

        return Array.from(colors)
    })

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

        // добавим обработчик кликов на ноды
        initNodeClicks()
    }

    function initNodeClicks() {
        if (!svgRef.value) return
        const svg = d3.select(svgRef.value)

        svg.selectAll('.node')
            .on('click', (event) => {
                event.stopPropagation()
                const targetNode = event.currentTarget as SVGGElement
                const nodeId = parseInt(targetNode.getAttribute('data-node-id') || '0', 10)
                const node = nodes.value.find(n => n.id === nodeId)
                if (node) {
                    handleNodeClick(node)
                }
            })
    }

    function bindDragToNodes() {
        if (!svgRef.value || !dragBehavior) return
        const svg = d3.select(svgRef.value)
        svg.selectAll<SVGGElement, unknown>('.node').call(dragBehavior as any)

        // также переустанавливаем обработчики кликов
        initNodeClicks()
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

    function openBuildingSelector() {
        isBuildingSelectorOpen.value = true
    }

    function closeBuildingSelector() {
        isBuildingSelectorOpen.value = false
    }

    function addBuildingNode(building: Item) {
        const newNode = {
            id: Date.now(),
            name: building.name,
            x: 0,
            y: 0,
            item: building
        }
        // ставим в центр текущего экрана (в координатах сцены)
        const cx = view.w / 2
        const cy = view.h / 2
        const [sx, sy] = currentTransform.invert([cx, cy])
        newNode.x = sx
        newNode.y = sy
        nodesStore.addNode(newNode)
    }

    function openEditPanel(node: Node) {
        selectedNode.value = node
        isEditPanelOpen.value = true
    }

    function closeEditPanel() {
        isEditPanelOpen.value = false
        selectedNode.value = null
    }

    function toggleConnectionMode() {
        if (isCreatingConnection.value) {
            connectionsStore.cancelCreatingConnection()
        } else {
            connectionsStore.startCreatingConnection()
        }
        // Сбрасываем выделение ноды при переключении режима
        selectedNode.value = null
        selectedConnection.value = null
        closeEditPanel()
        closeConnectionEditPanel()
    }

    function handleNodeClick(node: Node) {
        if (isCreatingConnection.value) {
            // В режиме создания связи обрабатываем клик по ноде
            // НЕ открываем панель редактирования ноды
            connectionsStore.selectNodeForConnection(node.id, nodes.value)
        } else {
            // Обычный режим - открываем панель редактирования ноды
            // Закрываем панель связи если она открыта
            closeConnectionEditPanel()
            openEditPanel(node)
        }
    }

    function selectConnection(connection: Connection) {
        selectedConnection.value = connection
        selectedNode.value = null
        // Закрываем панель ноды если она открыта
        closeEditPanel()
        openConnectionEditPanel(connection)
    }

    function openConnectionEditPanel(connection: Connection) {
        selectedConnection.value = connection
        isConnectionEditPanelOpen.value = true
    }

    function closeConnectionEditPanel() {
        isConnectionEditPanelOpen.value = false
        selectedConnection.value = null
    }

    function handleMouseMove(event: MouseEvent) {
        if (!svgRef.value) return

        // Получаем координаты мыши в системе координат SVG
        const rect = svgRef.value.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        // Применяем текущий трансформ для получения координат в пространстве сцены
        const [sceneX, sceneY] = currentTransform.invert([x, y])

        mousePosition.value = { x: sceneX, y: sceneY }
    }

    function handleCanvasClick(event: MouseEvent) {
        // Клик по холсту - сбрасываем выделение
        if (!isCreatingConnection.value) {
            selectedNode.value = null
            selectedConnection.value = null
            closeEditPanel()
            closeConnectionEditPanel()
        } else {
            // В режиме создания связи клик по холсту отменяет создание
            connectionsStore.cancelCreatingConnection()
        }
    }

    function deleteNode(nodeId: number) {
        // Удаляем все связи для этой ноды
        connectionsStore.deleteConnectionsForNode(nodeId)
        // Удаляем саму ноду
        nodesStore.removeNode(nodeId)
    }

    function updateNodeRecipe(nodeId: number, recipe: Recipe | null) {
        nodesStore.updateNodeRecipe(nodeId, recipe)
    }

    function updateNodeVeins(nodeId: number, veins: number) {
        nodesStore.updateNodeVeins(nodeId, veins)
    }

    function deleteConnection(connectionId: number) {
        connectionsStore.deleteConnection(connectionId)
        closeConnectionEditPanel()
    }

    function updateConnectionBelt(connectionId: number, belt: Item | null) {
        connectionsStore.updateConnectionBelt(connectionId, belt)
    }

    function updateConnectionInputSorter(connectionId: number, sorter: Item | null) {
        connectionsStore.updateConnectionInputSorter(connectionId, sorter)
    }

    function updateConnectionOutputSorter(connectionId: number, sorter: Item | null) {
        connectionsStore.updateConnectionOutputSorter(connectionId, sorter)
    }

    function updateConnectionSyncSorters(connectionId: number, syncSorters: boolean) {
        connectionsStore.updateConnectionSyncSorters(connectionId, syncSorters)
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

        // Обновляем координаты связей при изменении позиций нод
        watch(
            () => nodes.value.map(n => ({ id: n.id, x: n.x, y: n.y })),
            (newNodes) => {
                newNodes.forEach(node => {
                    connectionsStore.updateConnectionCoordinates(node.id, node.x, node.y)
                })
            },
            { deep: true }
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

    .control-btn.active {
        background: #28a745;
    }

    .control-btn.active:hover {
        background: #218838;
    }

    .control-btn.disabled {
        background: #6c757d;
        cursor: not-allowed;
        opacity: 0.6;
    }

    .control-btn.disabled:hover {
        background: #6c757d;
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
        position: relative;
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

    /* Предварительная связь */
    .preview-connection {
        pointer-events: none;
        opacity: 0.7;
    }
</style>