import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface BeltsData {
  belts: string[]
  sorters: string[]
}

export const useBeltsStore = defineStore('belts', () => {
  const beltsData = ref<BeltsData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadBelts() {
    if (beltsData.value) return // Уже загружены

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/data/belts.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      beltsData.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to load belts:', err)
    } finally {
      isLoading.value = false
    }
  }

  function getAllBelts(): string[] {
    return beltsData.value?.belts || []
  }

  function getAllSorters(): string[] {
    return beltsData.value?.sorters || []
  }

  return {
    beltsData,
    isLoading,
    error,
    loadBelts,
    getAllBelts,
    getAllSorters
  }
})