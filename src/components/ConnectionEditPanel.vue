<template>
    <div v-if="isOpen" class="connection-panel">
        <div class="connection-panel__header">
            <div class="connection-panel__header-content">
                <div class="connection-panel__header-icon">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M4 16 L28 16" stroke="#6b7280" stroke-width="3" stroke-linecap="round" />
                        <path d="M20 8 L28 16 L20 24" stroke="#6b7280" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
                <h3 class="connection-panel__title">Связь</h3>
            </div>
            <button class="connection-panel__close-btn" @click="closePanel">×</button>
        </div>

        <div class="connection-panel__content">
            <div class="connection-panel__connection-info">
                <div class="connection-panel__info-item">
                    <span class="connection-panel__info-label">От:</span>
                    <span class="connection-panel__info-value">{{ fromNodeName }}</span>
                </div>
                <div class="connection-panel__info-item">
                    <span class="connection-panel__info-label">К:</span>
                    <span class="connection-panel__info-value">{{ toNodeName }}</span>
                </div>
            </div>


            <div v-if="availableResources.length > 1" class="connection-panel__resource-section">
                <h4 class="connection-panel__section-title">Ресурс</h4>
                <div class="connection-panel__resource-grid">
                    <div v-for="resource in availableResources" :key="resource.id" class="connection-panel__resource-item" :class="{ 'connection-panel__resource-item_selected': selectedConnection?.selectedResource === resource.id }" :title="resource.name" @click="selectResource(resource.id)">
                        <GameIcon :id="resource.id" :size="48" />
                        <div class="connection-panel__resource-quantity">{{ resource.quantity }}</div>
                    </div>
                </div>
            </div>

            <div class="connection-panel__belt-section">
                <h4 class="connection-panel__section-title">Конвейер</h4>
                <div class="connection-panel__belt-grid">
                    <div v-for="belt in belts" :key="belt.id" class="connection-panel__belt-item" :class="{ 'connection-panel__belt-item_selected': selectedConnection?.belt?.id === belt.id }" :title="belt.name" @click="selectBelt(belt)">
                        <GameIcon :id="belt.id" :size="48" />
                    </div>
                    <div class="connection-panel__belt-item connection-panel__belt-item_remove" :class="{ 'connection-panel__belt-item_selected': !selectedConnection?.belt }" title="Убрать конвейер" @click="removeBelt">
                        <span>×</span>
                    </div>
                </div>
            </div>

            <div class="connection-panel__sorters-section">
                <h4 class="connection-panel__section-title">Сортеры</h4>

                <div class="connection-panel__sync-checkbox">
                    <label class="connection-panel__checkbox-label">
                        <input type="checkbox" :checked="selectedConnection?.syncSorters !== false" @change="toggleSyncSorters" />
                        <span class="connection-panel__checkbox-text">Одинаковые сортеры</span>
                    </label>
                </div>

                <div class="connection-panel__sorter-group">
                    <h5 class="connection-panel__sorter-group-title">{{ selectedConnection?.syncSorters !== false ? 'Сортер' : 'Входной сортер' }}</h5>
                    <div class="connection-panel__sorter-grid">
                        <div v-for="sorter in sorters" :key="`input-${sorter.id}`" class="connection-panel__sorter-item" :class="{ 'connection-panel__sorter-item_selected': selectedConnection?.inputSorter?.id === sorter.id }" :title="sorter.name" @click="selectInputSorter(sorter)">
                            <GameIcon :id="sorter.id" :size="48" />
                        </div>
                        <div class="connection-panel__sorter-item connection-panel__sorter-item_remove" :class="{ 'connection-panel__sorter-item_selected': !selectedConnection?.inputSorter }" title="Убрать сортер" @click="removeInputSorter">
                            <span>×</span>
                        </div>
                    </div>
                </div>

                <div class="connection-panel__sorter-group" v-if="selectedConnection?.syncSorters === false">
                    <h5 class="connection-panel__sorter-group-title">Выходной сортер</h5>
                    <div class="connection-panel__sorter-grid">
                        <div v-for="sorter in sorters" :key="`output-${sorter.id}`" class="connection-panel__sorter-item" :class="{ 'connection-panel__sorter-item_selected': selectedConnection?.outputSorter?.id === sorter.id }" :title="sorter.name" @click="selectOutputSorter(sorter)">
                            <GameIcon :id="sorter.id" :size="48" />
                        </div>
                        <div class="connection-panel__sorter-item connection-panel__sorter-item_remove" :class="{ 'connection-panel__sorter-item_selected': !selectedConnection?.outputSorter }" title="Убрать выходной сортер" @click="removeOutputSorter">
                            <span>×</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="throughputResult.throughput > 0 || selectedConnection" class="connection-panel__throughput-section">
                <h4 class="connection-panel__section-title">Пропускная способность</h4>
                <div class="connection-panel__throughput-info">
                    <div class="connection-panel__throughput-main">
                        <span class="connection-panel__throughput-value">{{ throughputText }}</span>
                    </div>
                    <div class="connection-panel__throughput-details">
                        <div class="connection-panel__throughput-item">
                            <span class="connection-panel__throughput-label">Производство:</span>
                            <span class="connection-panel__throughput-detail-value">{{ throughputResult.calculation.producerRate.toFixed(2) }} шт/сек</span>
                        </div>
                        <div v-if="selectedConnection?.inputSorter" class="connection-panel__throughput-item">
                            <span class="connection-panel__throughput-label">Входной сортер:</span>
                            <span class="connection-panel__throughput-detail-value">{{ throughputResult.calculation.inputSorterRate.toFixed(2) }} шт/сек</span>
                        </div>
                        <div v-if="selectedConnection?.outputSorter" class="connection-panel__throughput-item">
                            <span class="connection-panel__throughput-label">Выходной сортер:</span>
                            <span class="connection-panel__throughput-detail-value">{{ throughputResult.calculation.outputSorterRate.toFixed(2) }} шт/сек</span>
                        </div>
                        <div v-if="selectedConnection?.belt" class="connection-panel__throughput-item">
                            <span class="connection-panel__throughput-label">Конвейер:</span>
                            <span class="connection-panel__throughput-detail-value">{{ throughputResult.calculation.beltRate.toFixed(2) }} шт/сек</span>
                        </div>
                    </div>
                    <div v-if="throughputResult.bottlenecks.length > 0" class="connection-panel__throughput-bottlenecks">
                        <span class="connection-panel__bottlenecks-label">Узкие места:</span>
                        <span class="connection-panel__bottlenecks-value">{{ throughputResult.bottlenecks.join(', ') }}</span>
                    </div>
                </div>
            </div>

            <div class="connection-panel__actions">
                <button class="connection-panel__delete-btn" @click="deleteConnection">
                    Удалить связь
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onMounted } from 'vue'
    import type { Connection } from '@/types/Connection'
    import type { Node } from '@/types/Node'
    import type { Item } from '@/types/Item'
    import GameIcon from './GameIcon.vue'
    import { useBeltsStore } from '@/stores/beltsStore'
    import { useItemsStore } from '@/stores/itemsStore'
    import { useRecipesStore } from '@/stores/recipesStore'
    import { ThroughputCalculator } from '@/utils/ThroughputCalculator'

    interface Props {
        isOpen: boolean
        selectedConnection: Connection | null
        nodes: Node[]
        connections: Connection[]
    }

    interface Emits {
        (e: 'close'): void
        (e: 'delete', connectionId: number): void
        (e: 'update-belt', connectionId: number, belt: Item | null): void
        (e: 'update-input-sorter', connectionId: number, sorter: Item | null): void
        (e: 'update-output-sorter', connectionId: number, sorter: Item | null): void
        (e: 'update-sync-sorters', connectionId: number, syncSorters: boolean): void
        (e: 'update-selected-resource', connectionId: number, resourceId: string): void
    }

    const props = defineProps<Props>()
    const emit = defineEmits<Emits>()

    const beltsStore = useBeltsStore()
    const { loadBelts, getAllBelts, getAllSorters } = beltsStore

    const itemsStore = useItemsStore()
    const { getItemById, loadBuildings, loadIcons } = itemsStore

    const recipesStore = useRecipesStore()
    const { loadRecipes, getRecipeById } = recipesStore

    // Получаем данные из стора
    const belts = computed(() => {
        const beltIds = getAllBelts()
        return beltIds.map(id => getItemById(id)).filter(Boolean) as Item[]
    })

    const sorters = computed(() => {
        const sorterIds = getAllSorters()
        return sorterIds.map(id => getItemById(id)).filter(Boolean) as Item[]
    })

    // Получаем доступные ресурсы из рецепта исходной ноды
    const availableResources = computed(() => {
        if (!props.selectedConnection) return []

        const fromNode = props.nodes.find(n => n.id === props.selectedConnection!.fromNodeId)
        if (!fromNode?.recipe) return []

        const recipe = getRecipeById(fromNode.recipe.id).value
        if (!recipe?.out) return []

        // Преобразуем объект out в массив записей, игнорируя undefined значения
        const outEntries = Object.entries(recipe.out as Record<string, number>).filter(([_, value]) => value !== undefined && value > 0)

        return outEntries.map(([resourceId, quantity]) => ({
            id: resourceId,
            name: getItemById(resourceId)?.name || resourceId,
            quantity: quantity
        }))
    })

    // Получаем названия нод для отображения
    const fromNodeName = computed(() => {
        if (!props.selectedConnection) return ''
        const node = props.nodes.find(n => n.id === props.selectedConnection!.fromNodeId)
        return node?.item.name || `Нода ${props.selectedConnection.fromNodeId}`
    })

    const toNodeName = computed(() => {
        if (!props.selectedConnection) return ''
        const node = props.nodes.find(n => n.id === props.selectedConnection!.toNodeId)
        return node?.item.name || `Нода ${props.selectedConnection.toNodeId}`
    })

    // Рассчитываем пропускную способность
    const throughputResult = computed(() => {
        if (!props.selectedConnection) {
            return { throughput: 0, unit: 'предм/сек', bottlenecks: [], calculation: { producerRate: 0, inputSorterRate: 0, outputSorterRate: 0, beltRate: 0 } }
        }

        const fromNode = props.nodes.find(n => n.id === props.selectedConnection!.fromNodeId)
        const toNode = props.nodes.find(n => n.id === props.selectedConnection!.toNodeId)

        if (!fromNode || !toNode) {
            return { throughput: 0, unit: 'предм/сек', bottlenecks: [], calculation: { producerRate: 0, inputSorterRate: 0, outputSorterRate: 0, beltRate: 0 } }
        }

        return ThroughputCalculator.calculateThroughput(
            props.selectedConnection,
            fromNode,
            toNode,
            props.selectedConnection.inputSorter,
            props.selectedConnection.outputSorter,
            props.selectedConnection.belt,
            props.connections,
            props.nodes
        )
    })

    // Форматированный текст пропускной способности
    const throughputText = computed(() => {
        return ThroughputCalculator.formatThroughput(throughputResult.value)
    })

    onMounted(async () => {
        await Promise.all([loadBelts(), loadBuildings(), loadIcons(), loadRecipes()])
    })

    function closePanel() {
        emit('close')
    }

    function deleteConnection() {
        if (props.selectedConnection) {
            emit('delete', props.selectedConnection.id)
            closePanel()
        }
    }

    function selectBelt(belt: Item) {
        if (props.selectedConnection) {
            emit('update-belt', props.selectedConnection.id, belt)
        }
    }

    function removeBelt() {
        if (props.selectedConnection) {
            emit('update-belt', props.selectedConnection.id, null)
        }
    }

    function selectInputSorter(sorter: Item) {
        if (props.selectedConnection) {
            emit('update-input-sorter', props.selectedConnection.id, sorter)

            // Если синхронизация включена, обновляем и выходной сортер
            if (props.selectedConnection.syncSorters !== false) {
                emit('update-output-sorter', props.selectedConnection.id, sorter)
            }
        }
    }

    function removeInputSorter() {
        if (props.selectedConnection) {
            emit('update-input-sorter', props.selectedConnection.id, null)

            // Если синхронизация включена, убираем и выходной сортер
            if (props.selectedConnection.syncSorters !== false) {
                emit('update-output-sorter', props.selectedConnection.id, null)
            }
        }
    }

    function selectOutputSorter(sorter: Item) {
        if (props.selectedConnection) {
            emit('update-output-sorter', props.selectedConnection.id, sorter)
        }
    }

    function removeOutputSorter() {
        if (props.selectedConnection) {
            emit('update-output-sorter', props.selectedConnection.id, null)
        }
    }

    function selectResource(resourceId: string) {
        if (props.selectedConnection) {
            emit('update-selected-resource', props.selectedConnection.id, resourceId)
        }
    }

    function toggleSyncSorters(event: Event) {
        if (props.selectedConnection) {
            const target = event.target as HTMLInputElement
            const syncSorters = target.checked

            emit('update-sync-sorters', props.selectedConnection.id, syncSorters)

            // Если включаем синхронизацию, копируем входной сортер в выходной
            if (syncSorters && props.selectedConnection.inputSorter) {
                emit('update-output-sorter', props.selectedConnection.id, props.selectedConnection.inputSorter)
            }
        }
    }
</script>

<style lang="scss" scoped>
    .connection-panel {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 350px;
        height: calc(100vh - 142px);
        background: white;
        border-left: 1px solid #e5e7eb;
        box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 100;
        display: flex;
        flex-direction: column;

        &__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: .5rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            background: #f8fafc;
        }

        &__header-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        &__header-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: #f1f5f9;
            border-radius: 6px;
        }

        &__title {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
        }

        &__close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6b7280;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            transition: all 0.2s;

            &:hover {
                background: #f3f4f6;
                color: #374151;
            }
        }

        &__content {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
        }

        &__connection-info {
            margin-bottom: 2rem;
        }

        &__info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #f3f4f6;

            &:last-child {
                border-bottom: none;
            }
        }

        &__info-label {
            font-weight: 500;
            color: #6b7280;
            font-size: 0.875rem;
        }

        &__info-value {
            font-weight: 600;
            color: #1f2937;
            font-size: 0.875rem;
        }

        &__section-title {
            margin: 0 0 1rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
        }

        &__resource-section {
            margin-bottom: 2rem;
        }

        &__resource-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(56px, 1fr));
            gap: 0.2rem;
        }

        &__resource-item {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            background: white;

            &:hover {
                border-color: #3b82f6;
                background: #f8fafc;
            }

            &_selected {
                border-color: #3b82f6;
                background: #eff6ff;
            }
        }

        &__resource-quantity {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #3b82f6;
            color: white;
            font-size: 0.625rem;
            font-weight: 600;
            padding: 0.125rem 0.25rem;
            border-radius: 4px;
            min-width: 1rem;
            text-align: center;
        }

        &__belt-section,
        &__sorters-section {
            margin-bottom: 2rem;
        }

        &__belt-grid,
        &__sorter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(56px, 1fr));
            gap: 0.2rem;
        }

        &__belt-item,
        &__sorter-item {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: white;

            &:hover {
                border-color: #3b82f6;
                background: #f8fafc;
            }

            &_selected {
                border-color: #3b82f6;
                background: #dbeafe;
            }

            &_remove {
                font-size: 1.5rem;
                font-weight: bold;
                color: #6b7280;

                &:hover {
                    color: #dc2626;
                    border-color: #dc2626;
                }

                &.connection-panel__belt-item_selected,
                &.connection-panel__sorter-item_selected {
                    color: #dc2626;
                    border-color: #dc2626;
                    background: #fef2f2;
                }
            }
        }

        &__sorter-group {
            margin-bottom: 1.5rem;
        }

        &__sorter-group-title {
            margin: 0 0 0.75rem 0;
            font-size: 0.875rem;
            font-weight: 500;
            color: #6b7280;
        }

        &__sync-checkbox {
            margin-bottom: 0.75rem;
        }

        &__checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 0.875rem;
            color: #374151;

            input[type="checkbox"] {
                margin-right: 0.5rem;
                width: 16px;
                height: 16px;
                cursor: pointer;
            }
        }

        &__checkbox-text {
            user-select: none;
        }

        &__throughput-section {
            margin-bottom: 2rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        &__throughput-info {
            // Контейнер для всей информации о пропускной способности
        }

        &__throughput-main {
            margin-bottom: 1rem;
            text-align: center;
        }

        &__throughput-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #059669;
        }

        &__throughput-details {
            margin-bottom: 0.75rem;
        }

        &__throughput-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.25rem 0;
            font-size: 0.875rem;
        }

        &__throughput-label {
            color: #6b7280;
            font-weight: 500;
        }

        &__throughput-detail-value {
            color: #374151;
            font-weight: 600;
        }

        &__throughput-bottlenecks {
            padding: 0.5rem;
            background: #fef3c7;
            border-radius: 4px;
            border-left: 3px solid #f59e0b;
        }

        &__bottlenecks-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #92400e;
            display: block;
            margin-bottom: 0.25rem;
        }

        &__bottlenecks-value {
            font-size: 0.75rem;
            color: #92400e;
            font-weight: 500;
        }

        &__actions {
            margin-top: auto;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
        }

        &__delete-btn {
            width: 100%;
            padding: 0.75rem 1rem;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
                background: #b91c1c;
            }
        }
    }

</style>