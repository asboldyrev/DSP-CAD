import { ref, computed } from 'vue'
import type { Recipe } from '@/types/Recipes'

const recipesData = ref<Recipe[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useRecipesStore = () => {
  const loadRecipes = async () => {
    if (recipesData.value.length > 0) return // Уже загружены
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch('/data/recipes.json')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      recipesData.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load recipes data'
      console.error('Error loading recipes:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getRecipeById = (id: string) => {
    return computed(() => recipesData.value.find((recipe: Recipe) => recipe.id === id))
  }

  const getRecipesByProducer = (producerId: string) => {
    return computed(() => {
      return recipesData.value.filter(recipe => 
        recipe.producers.includes(producerId)
      )
    })
  }

  const getRecipesByCategory = (category: string) => {
    return computed(() => {
      return recipesData.value.filter(recipe => recipe.category === category)
    })
  }

  const getAllRecipes = computed(() => recipesData.value)

  return {
    // Состояние
    recipesData: computed(() => recipesData.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Методы
    loadRecipes,
    getRecipeById,
    getRecipesByProducer,
    getRecipesByCategory,
    getAllRecipes
  }
}