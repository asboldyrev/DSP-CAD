<template>
  <Teleport
    v-if="isOpen"
    to="#sidebar-header-target"
  >
    <div class="node-panel-header">
      <div class="node-panel-header__content">
        <div class="node-panel-header__icon">
          <GameIcon
            v-if="selectedNode"
            :key="selectedNode.id"
            :id="selectedNode.item.id"
            :size="32"
          />
        </div>
        <h3 class="node-panel-header__title">{{ selectedNode?.item.name }}</h3>
      </div>
      <BaseButton
        @click="closePanel"
        icon="ri-close-line"
        class="node-panel-header__close-btn"
      ></BaseButton>
    </div>
  </Teleport>

  <div
    v-if="isOpen"
    class="node-panel-content"
  >
      <div
        class="node-panel__recipes-section"
        v-if="recipes.length > 0"
      >
        <h4 class="node-panel__section-title">Рецепты</h4>
        <div class="node-panel__recipes-container">
          <div class="node-panel__recipes-grid">
            <div
              v-for="recipe in recipes"
              :key="recipe.id"
              class="node-panel__recipe-item"
              :class="{
                'node-panel__recipe-item_selected': selectedNode?.recipe?.id === recipe.id,
              }"
              :title="recipe.name"
              @click="selectRecipe(recipe)"
            >
              <div class="node-panel__recipe-icon">
                <GameIcon
                  :id="recipe.id"
                  :title="recipe.name"
                  :size="48"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="node-panel__selected-recipe-section"
        v-if="selectedNode?.recipe"
      >
        <h4 class="node-panel__section-title">Выбранный рецепт</h4>
        <div class="node-panel__selected-recipe">
          <div class="node-panel__selected-recipe-icon">
            <GameIcon
              :key="`selected-recipe-${selectedNode.id}-${selectedNode.recipe.id}`"
              :id="selectedNode.recipe.id"
              :size="32"
            />
          </div>
          <span class="node-panel__selected-recipe-name">{{ selectedNode.recipe.name }}</span>
          <BaseButton
            @click="removeRecipe"
            icon="ri-close-line"
            remove
            title="Удалить рецепт"
          ></BaseButton>
        </div>

        <!-- Детали рецепта -->
        <div class="node-panel__recipe-details">
          <div class="node-panel__recipe-time">
            <span class="node-panel__recipe-time-label">Время:</span>
            <span class="node-panel__recipe-time-value">{{ selectedNode.recipe.time }}с</span>
          </div>

          <!-- Входные ресурсы -->
          <div
            class="node-panel__recipe-inputs"
            v-if="recipeInputs.length > 0"
          >
            <span class="node-panel__recipe-inputs-label">Вход:</span>
            <div class="node-panel__recipe-items">
              <div
                v-for="input in recipeInputs"
                :key="input.id"
                class="node-panel__recipe-item"
              >
                <GameIcon
                  :id="input.id"
                  :size="20"
                />
                <span class="node-panel__recipe-item-quantity">{{ input.quantity }}</span>
              </div>
            </div>
          </div>

          <!-- Выходные ресурсы -->
          <div
            class="node-panel__recipe-outputs"
            v-if="recipeOutputs.length > 0"
          >
            <span class="node-panel__recipe-outputs-label">Выход:</span>
            <div class="node-panel__recipe-items">
              <div
                v-for="output in recipeOutputs"
                :key="output.id"
                class="node-panel__recipe-item"
              >
                <GameIcon
                  :id="output.id"
                  :size="20"
                />
                <span class="node-panel__recipe-item-quantity">{{ output.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="node-panel__veins-section"
        v-if="isMiner && (selectedNode?.recipe || selectedNode?.item.id === 'oil-extractor')"
      >
        <h4 class="node-panel__section-title">{{ productionResult.inputLabel }}</h4>
        <div class="node-panel__veins-input">
          <input
            type="number"
            v-model.number="inputValue"
            :min="productionResult.inputMin"
            :max="productionResult.inputMax"
            :step="productionResult.inputStep"
            :placeholder="productionResult.inputLabel"
            @input="updateInput"
          />
          <span class="node-panel__veins-unit">{{ getInputUnit() }}</span>
        </div>
        <div
          class="node-panel__production-info"
          v-if="productionResult.rate > 0 || (isProcessor && selectedNode?.recipe)"
        >
          <div class="node-panel__production-rate">
            <span class="node-panel__production-label">Производительность:</span>
            <span class="node-panel__production-value">
              {{ productionResult.rate.toFixed(productionResult.inputPrecision || 2) }}
              {{ productionResult.unit }}
            </span>
          </div>
        </div>
      </div>

      <div
        class="node-panel__building-count-section"
        v-if="isProcessor && selectedNode?.recipe"
      >
        <h4 class="node-panel__section-title">{{ productionResult.inputLabel }}</h4>
        <div class="node-panel__building-count-input">
          <input
            type="number"
            v-model.number="buildingCountValue"
            :min="productionResult.inputMin"
            :max="productionResult.inputMax"
            :step="productionResult.inputStep"
            :placeholder="productionResult.inputLabel"
            @input="updateBuildingCount"
          />
          <span class="node-panel__building-count-unit">шт</span>
        </div>
        <div
          class="node-panel__production-info"
          v-if="productionResult.rate > 0 || (isProcessor && selectedNode?.recipe)"
        >
          <div class="node-panel__production-rate">
            <span class="node-panel__production-label">Производительность:</span>
            <span class="node-panel__production-value">
              {{ productionResult.rate.toFixed(productionResult.inputPrecision || 2) }}
              {{ productionResult.unit }}
            </span>
          </div>
        </div>
      </div>

      <div class="node-panel__actions">
        <BaseButton
          @click="deleteNode"
          icon="ri-delete-bin-line"
          remove
        >
          Удалить ноду
        </BaseButton>
      </div>
    </div>

    <!-- Коэффициент производительности -->
    <div
      class="node-panel__coefficient-section"
      v-if="selectedNode"
    >
    <h4 class="node-panel__section-title">Коэффициент производительности</h4>
    <div class="node-panel__coefficient-input">
      <input
        type="number"
        v-model.number="coefficientValue"
        :min="0"
        :step="0.1"
        placeholder="Коэффициент"
        @input="updateCoefficient"
      />
      <span class="node-panel__coefficient-unit">×</span>
    </div>
    <p class="node-panel__coefficient-hint">
      Значение 1 означает нормальную скорость, 2 – удвоенную и т.д.
    </p>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, watch, ref } from 'vue'
  import type { Node } from '@/types/Node'
  import type { Recipe } from '@/types/Recipe'
  import type { Connection } from '@/types/Connection'
  import GameIcon from './GameIcon.vue'
  import BaseButton from './BaseButton.vue'
  import { useRecipesStore } from '@/stores/recipesStore'
  import { useProducersStore } from '@/stores/producersStore'
  import { ProductionCalculator } from '@/utils/ProductionCalculator'
  import { InputResourceCalculator } from '@/utils/InputResourceCalculator'

  interface Props {
    isOpen: boolean
    selectedNode: Node | null
    allConnections?: Connection[]
    allNodes?: Node[]
  }

  interface Emits {
    (e: 'close'): void
    (e: 'delete', nodeId: number): void
    (e: 'update-recipe', nodeId: number, recipe: Recipe | null): void
    (e: 'update-veins', nodeId: number, veins: number): void
    (e: 'update-building-count', nodeId: number, buildingCount: number): void
    (e: 'update-coefficient', nodeId: number, coefficient: number | undefined): void
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

  // Проверяем, является ли строение процессором
  const isProcessor = computed(() => {
    if (!props.selectedNode) return false
    return ProductionCalculator.isProcessor(props.selectedNode)
  })

  // Получаем входные ресурсы рецепта
  const recipeInputs = computed(() => {
    if (!props.selectedNode?.recipe?.in) return []
    const inputEntries = Object.entries(
      props.selectedNode.recipe.in as unknown as Record<string, number>,
    )
    return inputEntries.map(([id, quantity]) => ({ id, quantity }))
  })

  // Получаем выходные ресурсы рецепта
  const recipeOutputs = computed(() => {
    if (!props.selectedNode?.recipe?.out) return []
    const outputEntries = Object.entries(
      props.selectedNode.recipe.out as unknown as Record<string, number>,
    )
    return outputEntries.map(([id, quantity]) => ({ id, quantity }))
  })

  // Значение ввода (жилы/скорость/постройки)
  const inputValue = ref(1)
  const buildingCountValue = ref(1)
  const coefficientValue = ref(1)

  // Расчет производительности с использованием калькулятора
  const productionResult = computed(() => {
    if (!props.selectedNode) {
      return ProductionCalculator.calculateProduction({} as Node)
    }

    // Создаем временную ноду с текущим значением ввода для расчета
    const tempNode = {
      ...props.selectedNode,
      veins: inputValue.value,
      buildingCount: buildingCountValue.value,
    }

    // Для процессоров учитываем входные ресурсы
    if (props.allConnections && props.allNodes && ProductionCalculator.isProcessor(tempNode)) {
      const actualRate = InputResourceCalculator.calculateActualProductionRate(
        tempNode,
        props.allConnections,
        props.allNodes,
      )
      const baseResult = ProductionCalculator.calculateProduction(tempNode)
      return {
        ...baseResult,
        rate: actualRate,
      }
    }

    return ProductionCalculator.calculateProduction(tempNode)
  })

  onMounted(() => {
    Promise.all([loadRecipes(), loadProducers()])
  })

  // Инициализируем значение ввода при смене ноды
  watch(
    () => props.selectedNode,
    (newNode) => {
      if (newNode) {
        inputValue.value = newNode.veins || 1
        buildingCountValue.value = newNode.buildingCount || 1
        coefficientValue.value = newNode.coefficient ?? 1
      }
    },
    { immediate: true },
  )

  function closePanel() {
    emit('close')
  }

  function updateInput() {
    if (props.selectedNode) {
      emit('update-veins', props.selectedNode.id, inputValue.value)
    }
  }

  function updateBuildingCount() {
    if (props.selectedNode) {
      emit('update-building-count', props.selectedNode.id, buildingCountValue.value)
    }
  }

  function updateCoefficient() {
    if (props.selectedNode) {
      // Treat NaN or non-positive coefficient as undefined (defaults to 1)
      const coeff = coefficientValue.value
      if (!coeff || coeff <= 0) {
        emit('update-coefficient', props.selectedNode.id, undefined)
      } else {
        emit('update-coefficient', props.selectedNode.id, coeff)
      }
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

<style lang="scss" scoped>
  .node-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    &__content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    &__icon {
      flex-shrink: 0;
    }

    &__title {
      margin: 0;
      font-size: 1.125rem;
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
  }

  .node-panel-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    &__section-title {
      margin: 0 0 0.75rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
    }

    &__recipes-container {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.5rem;
      background: #f9fafb;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    }

    &__recipes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
      gap: 0.5rem;
    }

    &__recipe-item {
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
        background: #f8fafc;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &_selected {
        border-color: #10b981;
        background: #ecfdf5;
      }
    }

    &__selected-recipe-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    &__selected-recipe {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    &__selected-recipe-icon {
      flex-shrink: 0;
    }

    &__selected-recipe-name {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
    }

    &__remove-recipe-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      padding: 0;
      min-width: 24px;

      .base-button__icon {
        margin-right: 0 !important;
        font-size: 1rem;
      }
    }

    &__recipe-details {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    &__recipe-time {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    &__recipe-time-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
    }

    &__recipe-time-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    &__recipe-inputs,
    &__recipe-outputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    &__recipe-inputs-label,
    &__recipe-outputs-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      min-width: 3rem;
    }

    &__recipe-items {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    &__recipe-item-quantity {
      font-size: 0.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    &__veins-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    &__veins-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;

      input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }

    &__veins-unit {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    &__production-info {
      padding: 0.75rem;
      background: #ecfdf5;
      border-radius: 6px;
      border: 1px solid #10b981;
    }

    &__production-rate {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &__production-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #065f46;
    }

    &__production-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #047857;
    }

    &__building-count-section {
      margin-bottom: 1.5rem;
    }

    &__building-count-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;

      input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        background: white;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }

    &__building-count-unit {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
      min-width: 2rem;
    }

    &__actions {
      margin-top: auto;
    }

    &__delete-btn {
      width: 100%;
    }
  }

  .node-panel__coefficient-section {
    margin-top: 1rem;

    &__coefficient-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      input {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        background: white;
        transition: border-color 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }

    &__coefficient-unit {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
      min-width: 1.5rem;
    }

    &__coefficient-hint {
      font-size: 0.75rem;
      color: #6b7280;
    }
  }
</style>
