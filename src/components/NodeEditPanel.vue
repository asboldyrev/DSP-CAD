<template>
    <div v-if="isOpen" class="edit-panel">
        <div class="panel-header">
            <div class="header-content">
                <div class="header-icon">
                    <GameIcon v-if="selectedNode" :key="selectedNode.id" :id="selectedNode.item.id" :size="32" />
                </div>
                <h3>{{ selectedNode?.item.name }}</h3>
            </div>
            <button class="close-btn" @click="closePanel">×</button>
        </div>

        <div class="panel-content">
            <div class="recipes-section" v-if="recipes.length > 0">
                <h4>Рецепты</h4>
                <div class="recipes-container">
                    <div class="recipes-grid">
                        <div v-for="recipe in recipes" :key="recipe.id" class="recipe-item" :class="{ 'recipe-selected': selectedNode?.recipe?.id === recipe.id }" :title="recipe.name" @click="selectRecipe(recipe)">
                            <div class="recipe-icon">
                                <GameIcon :id="recipe.id" :title="recipe.name" :size="48" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="selected-recipe-section" v-if="selectedNode?.recipe">
                <h4>Выбранный рецепт</h4>
                <div class="selected-recipe">
                    <div class="selected-recipe-icon">
                        <GameIcon :key="`selected-recipe-${selectedNode.id}-${selectedNode.recipe.id}`" :id="selectedNode.recipe.id" :size="32" />
                    </div>
                    <span class="selected-recipe-name">{{ selectedNode.recipe.name }}</span>
                    <button class="remove-recipe-btn" @click="removeRecipe" title="Удалить рецепт">
                        ×
                    </button>
                </div>
            </div>

            <div class="veins-section" v-if="isMiner && (selectedNode?.recipe || selectedNode?.item.id === 'oil-extractor')">
                <h4>{{ productionResult.inputLabel }}</h4>
                <div class="veins-input">
                    <input type="number" v-model.number="inputValue" :min="productionResult.inputMin" :max="productionResult.inputMax" :step="productionResult.inputStep" :placeholder="productionResult.inputLabel" @input="updateInput" />
                    <span class="veins-unit">{{ getInputUnit() }}</span>
                </div>
                <div class="production-info" v-if="productionResult.rate > 0">
                    <div class="production-rate">
                        <span class="production-label">Производительность:</span>
                        <span class="production-value">{{ productionResult.rate.toFixed(productionResult.inputPrecision || 2) }} {{ productionResult.unit }}</span>
                    </div>
                </div>
            </div>

            <div class="panel-actions">
                <button class="delete-btn" @click="deleteNode">
                    Удалить ноду
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onMounted, watch, ref } from 'vue'
    import type { Node } from '@/types/Node'
    import type { Recipe } from '@/types/Recipes'
    import GameIcon from './GameIcon.vue'
    import { useRecipesStore } from '@/stores/recipesStore'
    import { useProducersStore } from '@/stores/producersStore'
    import { ProductionCalculator } from '@/utils/ProductionCalculator'

    interface Props {
        isOpen: boolean
        selectedNode: Node | null
    }

    interface Emits {
        (e: 'close'): void
        (e: 'delete', nodeId: number): void
        (e: 'update-recipe', nodeId: number, recipe: Recipe | null): void
        (e: 'update-veins', nodeId: number, veins: number): void
    }

    const props = defineProps<Props>()
    const emit = defineEmits<Emits>()

    const recipesStore = useRecipesStore()
    const { loadRecipes, getRecipesByProducer } = recipesStore

    const producersStore = useProducersStore()
    const { loadProducers } = producersStore

    // Получаем рецепты для выбранного строения
    const recipes = computed(() => {
        if (!props.selectedNode) return []
        const recipesForProducer = getRecipesByProducer(props.selectedNode.item.id)
        return recipesForProducer.value || []
    })

    // Проверяем, является ли строение майнером
    const isMiner = computed(() => {
        if (!props.selectedNode) return false
        return ProductionCalculator.isMiner(props.selectedNode.item.id)
    })

    // Значение ввода (жилы/скорость/постройки)
    const inputValue = ref(1)

    // Расчет производительности с использованием калькулятора
    const productionResult = computed(() => {
        if (!props.selectedNode) {
            return ProductionCalculator.calculateProduction({} as Node)
        }

        // Создаем временную ноду с текущим значением ввода для расчета
        const tempNode = {
            ...props.selectedNode,
            veins: inputValue.value
        }

        return ProductionCalculator.calculateProduction(tempNode)
    })

    onMounted(() => {
        Promise.all([loadRecipes(), loadProducers()])
    })

    // Инициализируем значение ввода при смене ноды
    watch(() => props.selectedNode, (newNode) => {
        if (newNode) {
            inputValue.value = newNode.veins || 1
        }
    }, { immediate: true })

    function closePanel() {
        emit('close')
    }

    function updateInput() {
        if (props.selectedNode) {
            emit('update-veins', props.selectedNode.id, inputValue.value)
        }
    }

    function getInputUnit(): string {
        switch (productionResult.value.inputType) {
            case 'veins':
                return 'шт'
            case 'rate':
                return 'шт/сек'
            case 'buildings':
                return 'шт'
            default:
                return 'шт'
        }
    }

    function selectRecipe(recipe: Recipe) {
        if (props.selectedNode) {
            emit('update-recipe', props.selectedNode.id, recipe)
        }
    }

    function removeRecipe() {
        if (props.selectedNode) {
            emit('update-recipe', props.selectedNode.id, null)
        }
    }

    function deleteNode() {
        if (props.selectedNode) {
            emit('delete', props.selectedNode.id)
            closePanel()
        }
    }
</script>

<style scoped>
    .edit-panel {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 350px;
        height: calc(100vh - 142px);
        /* Вычитаем высоту панели управления */
        background: white;
        border-left: 1px solid #e5e7eb;
        box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 100;
        display: flex;
        flex-direction: column;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: .5rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f8fafc;
    }

    .header-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .header-icon {
        flex-shrink: 0;
    }

    .panel-header h3 {
        margin: 0;
        font-size: 1.25rem;
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

    .panel-content {
        padding: 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .recipes-section {
        margin-bottom: 1.5rem;
    }

    .recipes-section h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    .recipes-container {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.5rem;
        background: #f9fafb;
    }

    .recipes-container::-webkit-scrollbar {
        width: 6px;
    }

    .recipes-container::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
    }

    .recipes-container::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }

    .recipes-container::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }

    .recipes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
        gap: 0.5rem;
    }

    .recipe-item {
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

    .recipe-item:hover {
        border-color: #3b82f6;
        background: #f8fafc;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .recipe-item.recipe-selected {
        border-color: #10b981;
        background: #ecfdf5;
    }

    .selected-recipe-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    .selected-recipe-section h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    .selected-recipe {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .selected-recipe-icon {
        flex-shrink: 0;
    }

    .selected-recipe-name {
        flex: 1;
        font-size: 0.875rem;
        font-weight: 500;
        color: #111827;
    }

    .remove-recipe-btn {
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    }

    .remove-recipe-btn:hover {
        background: #b91c1c;
    }

    .veins-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
    }

    .veins-section h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
    }

    .veins-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .veins-input input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .veins-input input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .veins-unit {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
    }

    .production-info {
        padding: 0.75rem;
        background: #ecfdf5;
        border-radius: 6px;
        border: 1px solid #10b981;
    }

    .production-rate {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .production-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #065f46;
    }

    .production-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: #047857;
    }

    .recipe-icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .panel-actions {
        margin-top: auto;
    }

    .delete-btn {
        width: 100%;
        padding: 0.75rem 1rem;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background-color 0.2s;
    }

    .delete-btn:hover {
        background: #b91c1c;
    }
</style>