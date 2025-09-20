import { getRecipes } from '@/api'
import { Category } from '@/data-source/category'
import type { Recipe } from '@/data-source/dto/recipe.dto'
import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'

export const useRecipesStore = defineStore('recipes', () => {
    const recipes: Ref<Recipe[]> = ref([])
    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string | null> = ref(null)

    async function recipesLoad() {
        if (recipes.value.length > 0) return // Уже загружены

        isLoading.value = true
        error.value = null

        await getRecipes(isLoading, error).then((response) => {
            response.forEach((recipe: Recipe) => {
                recipes.value.push(recipe)
            })
        })
    }

    const getRecipeById = (id: string) => {
        return computed(() => recipes.value.find((recipe: Recipe) => recipe.id === id))
    }

    const getRecipesByProducer = (producerId: string) => {
        return computed(() =>
            recipes.value
                .filter((recipe) => recipe.producers.includes(producerId))
                .map((recipe) => ({ row: recipe.row, recipe }))
                .reduce((acc, { row, recipe }) => {
                    acc[row] = acc[row] || []
                    acc[row].push(recipe)
                    return acc
                }, [] as Recipe[][]),
        )
    }

    const getRecipesByCategory = (category: string) => {
        return computed(() =>
            recipes.value
                .filter((recipe) => recipe.category === category)
                .map((recipe) => ({ row: recipe.row, recipe }))
                .reduce((acc, { row, recipe }) => {
                    acc[row] = acc[row] || []
                    acc[row].push(recipe)
                    return acc
                }, [] as Recipe[][]),
        )
    }

    const allRecipes = computed(() => recipes.value)

    return {
        recipesLoad,
        getRecipeById,
        getRecipesByProducer,
        getRecipesByCategory,

        allRecipes,
    }
})
