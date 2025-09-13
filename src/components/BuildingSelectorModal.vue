<template>
    <div v-if="isOpen" class="modal" @click="closeModal">
        <div class="modal__content" @click.stop>
            <div class="modal__header">
                <h2 class="modal__title">Выберите строение</h2>
                <BaseButton @click="closeModal" icon="ri-close-line" class="modal__close-btn"></BaseButton>
            </div>

            <div class="modal__body">
                <div v-if="isLoading" class="modal__loading">
                    Загрузка строений...
                </div>

                <div v-else-if="error" class="modal__error">
                    Ошибка загрузки: {{ error }}
                </div>

                <div v-else class="modal__buildings">
                    <div v-for="row in sortedRows" :key="row" class="modal__buildings-row">
                        <div class="modal__buildings-grid">
                            <div v-for="building in buildingsGrouped[row]" :key="building.id" class="modal__building-tile" :title="building.name" @click="selectBuilding(building)">
                                <div class="modal__building-icon">
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
import { computed, onMounted } from 'vue'
import { useItemsStore } from '@/stores/itemsStore'
import type { Item } from '@/types/Item'
import GameIcon from './GameIcon.vue'
import BaseButton from './BaseButton.vue'

    interface Props {
        isOpen: boolean
    }

    interface Emits {
        (e: 'close'): void
        (e: 'select', building: Item): void
    }

    defineProps<Props>()
    const emit = defineEmits<Emits>()

    const itemsStore = useItemsStore()
    const { loadBuildings, loadProducers, getProducerBuildingsGroupedByRow, isLoading, error } = itemsStore

    // Получаем строения-производители, сгруппированные по строкам
    const buildingsGrouped = computed(() => {
        const grouped = getProducerBuildingsGroupedByRow()
        return grouped.value || {}
    })

    // Получаем отсортированные строки
    const sortedRows = computed(() => {
        return Object.keys(buildingsGrouped.value)
            .map(Number)
            .sort((a, b) => a - b)
    })

    onMounted(async () => {
        await Promise.all([loadBuildings(), loadProducers()])
    })

    function closeModal() {
        emit('close')
    }

    function selectBuilding(building: Item) {
        emit('select', building)
        closeModal()
    }
</script>

<style lang="scss" scoped>
    .modal {
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

        &__content {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            max-width: 800px;
            max-height: 80vh;
            width: 90%;
            display: flex;
            flex-direction: column;
        }

        &__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
        }

        &__title {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: #111827;
        }

        &__close-btn {
            background: none !important;
            border: none !important;
            font-size: 1.5rem;
            color: #6b7280 !important;
            padding: 0.25rem;
            border-radius: 4px;
            transition: background-color 0.2s;

            &:hover {
                background-color: #f3f4f6 !important;
                color: #374151 !important;
            }

            .base-button__icon {
                margin-right: 0 !important;
            }
        }

        &__body {
            padding: 1.5rem;
            overflow-y: auto;
            flex: 1;
        }

        &__loading,
        &__error {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
        }

        &__error {
            color: #dc2626;
        }

        &__buildings {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        }

        &__buildings-row {
            display: flex;
            flex-direction: column;
        }

        &__buildings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
            gap: 0.3rem;
        }

        &__building-tile {
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

            &:hover {
                border-color: #3b82f6;
                background-color: #f8fafc;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
            }
        }

        &__building-icon {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
</style>