<template>
    <div v-if="isLoading" class="item-card loading">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Loading item...</p>
        </div>
    </div>

    <div v-else-if="error" class="item-card error">
        <div class="error-content">
            <h3>Error</h3>
            <p>{{ error }}</p>
        </div>
    </div>

    <div v-else-if="!item" class="item-card not-found">
        <div class="not-found-content">
            <h3>Item Not Found</h3>
            <p>Item with ID "{{ id }}" was not found</p>
        </div>
    </div>

    <div v-else class="item-card" :class="itemCardClass">
        <div class="item-header">
            <GameIcon :id="item.id" class="item-icon" />
            <div class="item-info">
                <h3 class="item-name">{{ item.name }}</h3>
                <span class="item-category">{{ categoryName }}</span>
            </div>
        </div>

        <div v-if="item.machine" class="item-stats">
            <div class="stat-group">
                <h4>Machine Stats</h4>
                <div class="stat-item">
                    <span class="stat-label">Type:</span>
                    <span class="stat-value">{{ item.machine.type }}</span>
                </div>
                <div v-if="item.machine.usage !== undefined" class="stat-item">
                    <span class="stat-label">Usage:</span>
                    <span class="stat-value">{{ item.machine.usage }} kW</span>
                </div>
                <div v-if="item.machine.drain !== undefined" class="stat-item">
                    <span class="stat-label">Drain:</span>
                    <span class="stat-value">{{ item.machine.drain }} kW</span>
                </div>
                <div v-if="item.machine.speed !== undefined" class="stat-item">
                    <span class="stat-label">Speed:</span>
                    <span class="stat-value">{{ item.machine.speed }}x</span>
                </div>
                <div v-if="item.machine.modules !== undefined" class="stat-item">
                    <span class="stat-label">Modules:</span>
                    <span class="stat-value">{{ item.machine.modules }}</span>
                </div>
            </div>
        </div>

        <div v-if="item.fuel" class="item-stats">
            <div class="stat-group">
                <h4>Fuel Info</h4>
                <div class="stat-item">
                    <span class="stat-label">Category:</span>
                    <span class="stat-value">{{ item.fuel.category }}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Value:</span>
                    <span class="stat-value">{{ item.fuel.value }}</span>
                </div>
            </div>
        </div>

        <div v-if="item.belt" class="item-stats">
            <div class="stat-group">
                <h4>Belt Info</h4>
                <div class="stat-item">
                    <span class="stat-label">Speed:</span>
                    <span class="stat-value">{{ item.belt.speed }} items/s</span>
                </div>
            </div>
        </div>

        <div v-if="item.module" class="item-stats">
            <div class="stat-group">
                <h4>Module Info</h4>
                <div v-if="item.module.productivity !== undefined" class="stat-item">
                    <span class="stat-label">Productivity:</span>
                    <span class="stat-value">+{{ (item.module.productivity * 100).toFixed(1) }}%</span>
                </div>
                <div v-if="item.module.speed !== undefined" class="stat-item">
                    <span class="stat-label">Speed:</span>
                    <span class="stat-value">+{{ (item.module.speed * 100).toFixed(1) }}%</span>
                </div>
                <div v-if="item.module.consumption !== undefined" class="stat-item">
                    <span class="stat-label">Consumption:</span>
                    <span class="stat-value">+{{ (item.module.consumption * 100).toFixed(1) }}%</span>
                </div>
                <div v-if="item.module.sprays !== undefined" class="stat-item">
                    <span class="stat-label">Sprays:</span>
                    <span class="stat-value">{{ item.module.sprays }}</span>
                </div>
            </div>
        </div>

        <div v-if="item.stack" class="item-stats">
            <div class="stat-group">
                <h4>Storage</h4>
                <div class="stat-item">
                    <span class="stat-label">Stack Size:</span>
                    <span class="stat-value">{{ item.stack }}</span>
                </div>
            </div>
        </div>

        <div v-if="item.technology" class="item-stats">
            <div class="stat-group">
                <h4>Technology</h4>
                <div v-if="item.technology.prerequisites && item.technology.prerequisites.length > 0" class="stat-item">
                    <span class="stat-label">Prerequisites:</span>
                    <div class="prerequisites">
                        <span v-for="prereq in item.technology.prerequisites" :key="prereq" class="prerequisite-tag">
                            {{ prereq }}
                        </span>
                    </div>
                </div>
                <div v-if="item.technology.unlockedRecipes && item.technology.unlockedRecipes.length > 0" class="stat-item">
                    <span class="stat-label">Unlocks:</span>
                    <div class="unlocked-recipes">
                        <span v-for="recipe in item.technology.unlockedRecipes.slice(0, 5)" :key="recipe" class="recipe-tag">
                            {{ recipe }}
                        </span>
                        <span v-if="item.technology.unlockedRecipes && item.technology.unlockedRecipes.length > 5" class="more-recipes">
                            +{{ item.technology.unlockedRecipes.length - 5 }} more
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onMounted } from 'vue'
    import { CATEGORIES } from '@/enums/Category'
    import { useItemsStore } from '@/stores/itemsStore'
    import GameIcon from './GameIcon.vue'

    interface Props {
        id: string
    }

    const props = defineProps<Props>()

    const itemsStore = useItemsStore()
    const { loadItems, getItemById, isLoading, error } = itemsStore

    onMounted(() => {
        loadItems()
    })

    const item = getItemById(props.id)

    const categoryName = computed(() => {
        if (!item.value) return ''
        const category = CATEGORIES.find(cat => cat.id === item.value!.category)
        return category?.name || item.value!.category
    })

    const itemCardClass = computed(() => ({
        [`category-${item.value?.category}`]: !!item.value,
        'has-machine': !!item.value?.machine,
        'has-fuel': !!item.value?.fuel,
        'has-module': !!item.value?.module
    }))
</script>

<style scoped>
    .item-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s ease;
    }

    .item-card:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
    }

    .item-icon {
        flex-shrink: 0;
    }

    .item-info {
        flex: 1;
    }

    .item-name {
        margin: 0 0 4px 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: #333;
    }

    .item-category {
        font-size: 0.9rem;
        color: #666;
        background: #f5f5f5;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
    }

    .item-stats {
        margin-bottom: 16px;
    }

    .stat-group h4 {
        margin: 0 0 8px 0;
        font-size: 1rem;
        font-weight: 600;
        color: #444;
    }

    .stat-item {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        gap: 8px;
    }

    .stat-label {
        font-weight: 500;
        color: #666;
        min-width: 100px;
    }

    .stat-value {
        color: #333;
        font-weight: 600;
    }

    .prerequisites,
    .unlocked-recipes {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
    }

    .prerequisite-tag,
    .recipe-tag {
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .more-recipes {
        color: #666;
        font-style: italic;
        font-size: 0.8rem;
    }

    /* Category-specific styling */
    .category-components {
        border-left: 4px solid #4caf50;
    }

    .category-buildings {
        border-left: 4px solid #ff9800;
    }

    .category-technologies {
        border-left: 4px solid #9c27b0;
    }

    .category-upgrades {
        border-left: 4px solid #2196f3;
    }

    /* Состояния загрузки и ошибок */
    .item-card.loading,
    .item-card.error,
    .item-card.not-found {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
    }

    .loading-content,
    .error-content,
    .not-found-content {
        text-align: center;
    }

    .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }

    .item-card.error {
        border-left: 4px solid #e74c3c;
    }

    .item-card.not-found {
        border-left: 4px solid #f39c12;
    }
</style>