<template>
    <teleport :to="`#${headerTargetId}`">
        <div class="header-content">
            <div class="header-icon">
                <GameIcon v-if="nodesStore.selectedNode" :key="nodesStore.selectedNode.id" :id="nodesStore.selectedNode.item.id" :size="32" />
            </div>
            <h3>{{ nodesStore.selectedNode?.item.name }}</h3>
        </div>
    </teleport>

    <div class="panel-content">
        <div class="recipes-section">
            <h4>Рецепты</h4>
            <div class="recipes-container">
                <div v-if="recipes.length > 0" class="recipes-grid">
                    <template v-for="(rowRecipes, row) in recipes" :key="row">
                        <template v-if="rowRecipes?.length">
                            <div class="recipe-row">
                                <div v-for="recipe in rowRecipes" :key="recipe.id" class="recipe-item" :class="{ 'recipe-selected': nodesStore.selectedNode?.recipe?.id === recipe.id }" :title="recipe.name" @click="selectRecipe(recipe)">
                                    <GameIcon :id="recipe.id" :title="recipe.name" :size="48" />
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
                <div v-else class="empty-recipes">
                    <p class="empty-recipes-text">Нет доступных рецептов</p>
                </div>
            </div>
        </div>

        <div class="selected-recipe-section" v-if="nodesStore.selectedNode?.recipe">
            <h4>Выбранный рецепт</h4>
            <div class="selected-recipe">
                <div class="selected-recipe-icon">
                    <GameIcon :key="`selected-recipe-${nodesStore.selectedNode.id}-${nodesStore.selectedNode.recipe.id}`" :id="nodesStore.selectedNode.recipe.id" :size="32" />
                </div>
                <span class="selected-recipe-name">{{ nodesStore.selectedNode.recipe.name }}</span>
                <button class="remove-recipe-btn" @click="removeRecipe" title="Удалить рецепт">
                    <i class="ri-close-line"></i>
                </button>
            </div>

            <!-- Детали рецепта -->
            <div class="recipe-details">
                <div class="recipe-time">
                    <span class="recipe-time-label">Время:</span>
                    <span class="recipe-time-value">{{ nodesStore.selectedNode.recipe.time }}с</span>
                </div>

                <!-- Входные ресурсы -->
                <div class="recipe-inputs" v-if="recipeInputs.length > 0">
                    <span class="recipe-inputs-label">Вход:</span>
                    <div class="recipe-items">
                        <div v-for="input in recipeInputs" :key="input?.id" class="recipe-item">
                            <GameIcon :id="input?.id" :title="input.name" :size="20" />
                            <span class="recipe-item-quantity">{{ input.quantity }}</span>
                        </div>
                    </div>
                </div>

                <!-- Выходные ресурсы -->
                <div class="recipe-outputs" v-if="recipeOutputs.length > 0">
                    <span class="recipe-outputs-label">Выход:</span>
                    <div class="recipe-items">
                        <div v-for="output in recipeOutputs" :key="output.id" class="recipe-item">
                            <GameIcon :id="output.id" :title="output.name" :size="20" />
                            <span class="recipe-item-quantity">{{ output.quantity }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="veins-section" v-if="producersStore.isMiner(nodesStore.selectedNode?.item.id!) && (nodesStore.selectedNode?.recipe || nodesStore.selectedNode?.item.id === 'oil-extractor')">
            <h4>{{ productionResult.inputLabel }}</h4>
            <div class="veins-input">
                <input type="number" v-model.number="inputValue" :min="productionResult.inputMin" :max="productionResult.inputMax" :step="productionResult.inputStep" :placeholder="productionResult.inputLabel" @input="updateInput" />
                <span class="veins-unit">{{ productionResult?.inputUnit }}</span>
            </div>
            <div class="production-info" v-if="productionResult.rate > 0 || (producersStore.isProcessor(nodesStore.selectedNode?.item?.id) && nodesStore.selectedNode?.recipe)">
                <div class="production-rate">
                    <span class="production-label">Производительность:</span>
                    <span class="production-value">{{ productionResult.rate.toFixed(productionResult.inputPrecision || 2) }} {{ productionResult.outputUnit }}</span>
                </div>
            </div>
        </div>

        <!-- <div class="building-count-section" v-if="isProcessor && selectedNode?.recipe">
            <h4>{{ productionResult.inputLabel }}</h4>
            <div class="building-count-input">
                <input type="number" v-model.number="buildingCountValue" :min="productionResult.inputMin" :max="productionResult.inputMax" :step="productionResult.inputStep" :placeholder="productionResult.inputLabel" @input="updateBuildingCount" />
                <span class="building-count-unit">шт</span>
            </div>
            <div class="production-info" v-if="productionResult.rate > 0 || (isProcessor && selectedNode?.recipe)">
                <div class="production-rate">
                    <span class="production-label">Производительность:</span>
                    <span class="production-value">{{ productionResult.rate.toFixed(productionResult.inputPrecision || 2) }} {{ productionResult.unit }}</span>
                </div>
            </div>
        </div> -->

        <div class="panel-actions">
            <button class="delete-btn" @click="deleteNode">
                Удалить ноду
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { Recipe } from '@/data-source/dto/recipe.dto';
    import { ProductionCalculator } from '@/domain/utils/productionCalculator';
    import { useItemsStore } from '@/stores/itemsStore';
    import { useNodesStore } from '@/stores/nodesStore';
    import { useProducersStore } from '@/stores/producersStore';
    import { useRecipesStore } from '@/stores/recipesStore';
    import { computed, ref } from 'vue';

    const props = withDefaults(defineProps<{ headerTargetId?: string }>(), {
        headerTargetId: 'sidebar-header-target',
    })

    const nodesStore = useNodesStore()
    const recipesStore = useRecipesStore()
    const itemsStore = useItemsStore()
    const producersStore = useProducersStore()

    // Значение ввода (жилы/скорость/постройки)
    const inputValue = ref(1)

    function selectRecipe(recipe: Recipe) {
        if (nodesStore.selectedNode) {
            nodesStore.updateNodeRecipe(nodesStore.selectedNode.id, recipe)
        }
    }

    function removeRecipe() {
        if (nodesStore.selectedNode) {
            nodesStore.updateNodeRecipe(nodesStore.selectedNode.id, null)
        }
    }

    function deleteNode() {
        const nodeId = nodesStore?.selectedNode?.id

        if (nodeId != undefined) {
            nodesStore.selectedNode = null
            nodesStore.removeNode(nodeId)
        }
    }

    function updateInput() {
        if (nodesStore.selectedNode) {
            nodesStore.selectedNode.factor = inputValue.value
        }
    }

    const recipes = computed(() => {
        const itemId = nodesStore.selectedNode?.item.id

        if (itemId) {
            return recipesStore.getRecipesByProducer(itemId).value
        }

        return []
    })

    const recipeInputs = computed(() => {
        let items = []

        for (let name in nodesStore.selectedNode?.recipe?.in) {
            items.push({
                ...itemsStore.getItemById(name),
                ...{ quantity: nodesStore.selectedNode?.recipe?.in[name] }
            })
        }
        return items
    })

    const recipeOutputs = computed(() => {
        let items = []

        for (let name in nodesStore.selectedNode?.recipe?.out) {
            items.push({
                ...itemsStore.getItemById(name),
                ...{ quantity: nodesStore.selectedNode?.recipe?.out[name] }
            })
        }
        return items
    })

    const productionResult = computed(() => {
        const node = nodesStore.selectedNode

        return ProductionCalculator.calculateProduction(node!)
    })

    // Проверяем, является ли строение майнером
    const isMiner = computed(() => {
        if (!nodesStore.selectedNode) return false
        return producersStore.isMiner(nodesStore.selectedNode.item.id)
    })
</script>

<style scoped lang="scss">
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
        height: 100%;
        margin-bottom: 1.5rem;
    }

    .recipes-section h4 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .recipes-container {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        background: #f9fafb;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
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
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .recipe-row {
        display: flex;
        gap: 0.1rem;
        flex-wrap: wrap;
        justify-content: flex-start;
        border-bottom: 1px solid #ccc;
        box-shadow: 0px 1px 1px 0px #ddd;
        padding-bottom: 0.5rem;

        &:last-child {
            border: none;
            box-shadow: none;
        }
    }

    .recipe-item {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background: white;
        position: relative;
        overflow: hidden;
    }

    .recipe-item:hover {
        border-color: #3b82f6;
        background: #f8fafc;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.15);
    }

    .recipe-item.recipe-selected {
        border-color: #10b981;
        background: #ecfdf5;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

    .recipe-item.recipe-selected:hover {
        border-color: #059669;
        background: #d1fae5;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
    }

    .empty-recipes {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        text-align: center;
        color: #6b7280;
    }

    .empty-recipes-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.6;
    }

    .empty-recipes-text {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
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

    /* Секция количества строений */
    .building-count-section {
        margin-bottom: 1.5rem;
    }

    .building-count-section h4 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
    }

    .building-count-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .building-count-input input {
        flex: 1;
        // padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        background: white;
        transition: border-color 0.2s;
    }

    .building-count-input input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .building-count-unit {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
        min-width: 2rem;
    }

    /* Детали рецепта */
    .recipe-details {
        margin-top: 0.75rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
    }

    .recipe-time {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .recipe-time-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
    }

    .recipe-time-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1e293b;
    }

    .recipe-inputs,
    .recipe-outputs {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .recipe-inputs:last-child,
    .recipe-outputs:last-child {
        margin-bottom: 0;
    }

    .recipe-inputs-label,
    .recipe-outputs-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
        min-width: 3rem;
    }

    .recipe-items {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .recipe-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        // padding: 0.25rem 0.5rem;
        background: white;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
    }

    .recipe-item-quantity {
        font-size: 0.75rem;
        font-weight: 600;
        color: #1e293b;
        padding: 0 8px;
        padding-left: 4px;
    }

    /* Коэффициент производительности */
    .coefficient-section {
        margin-top: 1rem;
    }

    .coefficient-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .coefficient-input input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        background: white;
        transition: border-color 0.2s;
    }

    .coefficient-input input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .coefficient-unit {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
        min-width: 1.5rem;
    }

    .coefficient-hint {
        font-size: 0.75rem;
        color: #6b7280;
    }
</style>
