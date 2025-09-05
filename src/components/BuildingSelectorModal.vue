<template>
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h2>Выберите строение</h2>
                <button class="close-btn" @click="closeModal">×</button>
            </div>

            <div class="modal-body">
                <div v-if="isLoading" class="loading">
                    Загрузка строений...
                </div>

                <div v-else-if="error" class="error">
                    Ошибка загрузки: {{ error }}
                </div>

                <div v-else class="buildings-container">
                    <div v-for="row in sortedRows" :key="row" class="buildings-row">
                        <div class="buildings-grid">
                            <div v-for="building in buildingsGrouped[row]" :key="building.id" class="building-tile" :title="building.name" @click="selectBuilding(building)">
                                <div class="building-icon">
                                    <GameIcon :id="building.id" :title="building.name" :size="48" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useItemsStore } from '@/stores/itemsStore'
    import type { Item } from '@/types/Item'
    import GameIcon from './GameIcon.vue'

    interface Props {
        isOpen: boolean
    }

    interface Emits {
        (e: 'close'): void
        (e: 'select', building: Item): void
    }

    const props = defineProps<Props>()
    const emit = defineEmits<Emits>()

    const itemsStore = useItemsStore()
    const { loadBuildings, getBuildingsGroupedByRow, isLoading, error } = itemsStore

    // Получаем строения, сгруппированные по строкам
    const buildingsGrouped = computed(() => {
        const grouped = getBuildingsGroupedByRow()
        return grouped.value || {}
    })

    // Получаем отсортированные строки
    const sortedRows = computed(() => {
        return Object.keys(buildingsGrouped.value)
            .map(Number)
            .sort((a, b) => a - b)
    })

    onMounted(() => {
        loadBuildings()
    })

    function closeModal() {
        emit('close')
    }

    function selectBuilding(building: Item) {
        emit('select', building)
        closeModal()
    }
</script>

<style scoped>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 800px;
        max-height: 80vh;
        width: 90%;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .close-btn:hover {
        background-color: #f3f4f6;
        color: #374151;
    }

    .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
    }

    .loading,
    .error {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }

    .error {
        color: #dc2626;
    }

    .buildings-container {
        display: flex;
        flex-direction: column;
        gap: .3rem;
    }

    .buildings-row {
        display: flex;
        flex-direction: column;
    }

    .buildings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
        gap: .3rem;
    }

    .building-tile {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
        width: 48px;
        height: 48px;
    }

    .building-tile:hover {
        border-color: #3b82f6;
        background-color: #f8fafc;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }

    .building-icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>