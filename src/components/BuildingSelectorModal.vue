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

                <div v-else class="buildings-grid">
                    <div v-for="building in buildings" :key="building.id" class="building-tile" @click="selectBuilding(building)">
                        <div class="building-icon">
                            <GameIcon :id="building.id" :size="48" />
                        </div>
                        <div class="building-name">{{ building.name }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useItemsStore } from '@/stores/itemsStore'
    import { Category } from '@/enums/Category'
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
    const { loadItems, getItemsByCategory, isLoading, error } = itemsStore

    // Получаем только строения
    const buildings = computed(() => {
        const buildingsData = getItemsByCategory(Category.BUILDINGS)
        return buildingsData.value || []
    })

    onMounted(() => {
        loadItems()
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

    .buildings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 1rem;
    }

    .building-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        background: white;
    }

    .building-tile:hover {
        border-color: #3b82f6;
        background-color: #f8fafc;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .building-icon {
        margin-bottom: 0.5rem;
    }

    .building-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        text-align: center;
        line-height: 1.2;
    }
</style>