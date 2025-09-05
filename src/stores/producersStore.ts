import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ProducersData {
  miners: string[]
  processors: string[]
}

export const useProducersStore = defineStore('producers', () => {
  const producersData = ref<ProducersData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadProducers() {
    if (producersData.value) return // Уже загружены

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/data/producers.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      producersData.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to load producers:', err)
    } finally {
      isLoading.value = false
    }
  }

  function getAllMiners(): string[] {
    return producersData.value?.miners || []
  }

  function getAllProcessors(): string[] {
    return producersData.value?.processors || []
  }

  function isMiner(buildingId: string): boolean {
    return getAllMiners().includes(buildingId)
  }

  function isProcessor(buildingId: string): boolean {
    return getAllProcessors().includes(buildingId)
  }

  return {
    producersData,
    isLoading,
    error,
    loadProducers,
    getAllMiners,
    getAllProcessors,
    isMiner,
    isProcessor
  }
})