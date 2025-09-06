<template>
    <!-- Невидимая широкая линия для увеличения области клика -->
    <line :x1="adjustedFromX" :y1="adjustedFromY" :x2="adjustedToX" :y2="adjustedToY" class="connection-hit-area" @click="onConnectionClick" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" />

    <!-- Видимая линия связи -->
    <line :x1="adjustedFromX" :y1="adjustedFromY" :x2="adjustedToX" :y2="adjustedToY" :class="connectionClass" :stroke="connectionColor" :stroke-width="strokeWidth" :marker-end="markerEnd" pointer-events="none" />

    <!-- Отображение пропускной способности -->
    <text v-if="throughputResult.throughput > 0" :x="throughputTextX" :y="throughputTextY" class="throughput-text" :class="{ 'throughput-text-selected': isSelected }">
        {{ throughputText }}
    </text>
</template>

<script setup lang="ts">
    import { computed, ref } from 'vue'
    import type { Connection } from '@/types/Connection'
    import type { Node } from '@/types/Node'
    import { ThroughputCalculator } from '@/utils/ThroughputCalculator'

    interface Props {
        connection: Connection
        isSelected?: boolean
        isHighlighted?: boolean
        fromNode?: Node
        toNode?: Node
    }

    interface Emits {
        (e: 'click', connection: Connection): void
    }

    const props = withDefaults(defineProps<Props>(), {
        isSelected: false,
        isHighlighted: false
    })

    const emit = defineEmits<Emits>()
    const isHovered = ref(false)

    // Рассчитываем пропускную способность
    const throughputResult = computed(() => {
        if (!props.fromNode || !props.toNode) {
            return { throughput: 0, unit: 'предм/сек', bottlenecks: [], calculation: { producerRate: 0, inputSorterRate: 0, outputSorterRate: 0, beltRate: 0 } }
        }

        return ThroughputCalculator.calculateThroughput(
            props.connection,
            props.fromNode,
            props.toNode,
            props.connection.inputSorter,
            props.connection.outputSorter,
            props.connection.belt
        )
    })

    // Форматированный текст пропускной способности
    const throughputText = computed(() => {
        return ThroughputCalculator.formatThroughput(throughputResult.value)
    })

    // Позиция текста пропускной способности (середина линии)
    const throughputTextX = computed(() => {
        return (adjustedFromX.value + adjustedToX.value) / 2
    })

    const throughputTextY = computed(() => {
        return (adjustedFromY.value + adjustedToY.value) / 2 - 8 // Смещаем вверх от линии
    })

    const connectionClass = computed(() => {
        const classes = ['connection']
        if (props.isSelected) classes.push('connection-selected')
        if (props.isHighlighted) classes.push('connection-highlighted')
        if (isHovered.value) classes.push('connection-hovered')
        return classes.join(' ')
    })

    const strokeWidth = computed(() => {
        if (props.isSelected) return 3
        if (props.isHighlighted) return 2.5
        if (isHovered.value) return 2.5
        return 2
    })

    const markerEnd = computed(() => {
        // Создаем уникальный ID маркера на основе цвета
        const colorId = connectionColor.value.replace('#', '')
        const markerId = props.isSelected ? `arrowhead-selected-${colorId}` : `arrowhead-${colorId}`
        return `url(#${markerId})`
    })

    // Получаем цвет конвейера из иконки
    const beltColor = computed(() => {
        if (!props.connection.belt?.icon?.color) return null

        // Получаем цвет из поля color иконки
        const iconColor = props.connection.belt.icon.color

        // Если цвет уже в формате hex, возвращаем как есть
        if (iconColor.startsWith('#')) {
            return iconColor
        }

        // Если цвет в формате rgb/rgba, конвертируем в hex
        if (iconColor.startsWith('rgb')) {
            const rgbMatch = iconColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
            if (rgbMatch) {
                const [, r, g, b] = rgbMatch
                return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`
            }
        }

        // Fallback к предопределенным цветам по ID
        const beltColors: Record<string, string> = {
            'conveyor-belt-1': '#8b5cf6', // Фиолетовый
            'conveyor-belt-2': '#06b6d4', // Голубой  
            'conveyor-belt-3': '#10b981'  // Зеленый
        }

        return beltColors[props.connection.belt.id] || null
    })

    // Цвет линии связи
    const connectionColor = computed(() => {
        if (props.isSelected) return '#3b82f6'
        if (props.isHighlighted) return '#10b981'
        if (beltColor.value) return beltColor.value
        if (isHovered.value) return '#4b5563'
        return '#6b7280'
    })

    // Корректируем координаты чтобы стрелка была видна
    const adjustedFromX = computed(() => {
        const dx = props.connection.toX - props.connection.fromX
        const dy = props.connection.toY - props.connection.fromY
        const length = Math.sqrt(dx * dx + dy * dy)
        if (length === 0) return props.connection.fromX

        // Отступаем от центра ноды на радиус (32px)
        const offset = 32
        const ratio = offset / length
        return props.connection.fromX + dx * ratio
    })

    const adjustedFromY = computed(() => {
        const dx = props.connection.toX - props.connection.fromX
        const dy = props.connection.toY - props.connection.fromY
        const length = Math.sqrt(dx * dx + dy * dy)
        if (length === 0) return props.connection.fromY

        // Отступаем от центра ноды на радиус (32px)
        const offset = 32
        const ratio = offset / length
        return props.connection.fromY + dy * ratio
    })

    const adjustedToX = computed(() => {
        const dx = props.connection.toX - props.connection.fromX
        const dy = props.connection.toY - props.connection.fromY
        const length = Math.sqrt(dx * dx + dy * dy)
        if (length === 0) return props.connection.toX

        // Отступаем от центра ноды на радиус (32px) + размер стрелки (14px)
        const offset = 32 + 14
        const ratio = offset / length
        return props.connection.toX - dx * ratio
    })

    const adjustedToY = computed(() => {
        const dx = props.connection.toX - props.connection.fromX
        const dy = props.connection.toY - props.connection.fromY
        const length = Math.sqrt(dx * dx + dy * dy)
        if (length === 0) return props.connection.toY

        // Отступаем от центра ноды на радиус (32px) + размер стрелки (14px)
        const offset = 32 + 14
        const ratio = offset / length
        return props.connection.toY - dy * ratio
    })

    function onConnectionClick(event: MouseEvent) {
        event.stopPropagation()
        emit('click', props.connection)
    }

    function onMouseEnter() {
        isHovered.value = true
    }

    function onMouseLeave() {
        isHovered.value = false
    }
</script>

<style scoped>
    .connection-hit-area {
        stroke: transparent;
        fill: none;
        stroke-width: 20;
        cursor: pointer;
    }

    .connection {
        fill: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .connection-selected {
        stroke-width: 3;
    }

    .connection-highlighted {
        stroke-width: 2.5;
    }

    .throughput-text {
        font-size: 12px;
        font-weight: 600;
        fill: #374151;
        text-anchor: middle;
        pointer-events: none;
        user-select: none;
    }

    .throughput-text-selected {
        fill: #1f2937;
        font-weight: 700;
    }
</style>