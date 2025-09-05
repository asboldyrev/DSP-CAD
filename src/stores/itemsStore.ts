import { ref, computed } from 'vue'
import type { Item } from '@/types/Item'

const buildingsData = ref<Item[]>([])
const producersData = ref<{ miners: string[], processors: string[] } | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useItemsStore = () => {
  const loadBuildings = async () => {
    if (buildingsData.value.length > 0) return // Уже загружены
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch('/data/Items/buildings.json')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      buildingsData.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load buildings data'
      console.error('Error loading buildings:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadProducers = async () => {
    if (producersData.value !== null) return // Уже загружены
    
    try {
      const response = await fetch('/data/producers.json')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      producersData.value = await response.json()
    } catch (err) {
      console.error('Error loading producers:', err)
    }
  }

  const getItemById = (id: string) => {
    return computed(() => buildingsData.value.find((item: Item) => item.id === id))
  }

  const getBuildingsByRow = (row: number) => {
    return computed(() => buildingsData.value.filter((item: Item) => item.row === row))
  }

  const getBuildingsGroupedByRow = () => {
    return computed(() => {
      const grouped: { [key: number]: Item[] } = {}
      buildingsData.value.forEach(item => {
        const row = item.row ?? 0
        if (!grouped[row]) {
          grouped[row] = []
        }
        grouped[row].push(item)
      })
      return grouped
    })
  }

  const getAllBuildings = computed(() => buildingsData.value)

  const getProducerBuildings = () => {
    return computed(() => {
      if (!producersData.value) return []
      
      const producerIds = [...producersData.value.miners, ...producersData.value.processors]
      return buildingsData.value.filter(building => producerIds.includes(building.id))
    })
  }

  const getProducerBuildingsGroupedByRow = () => {
    return computed(() => {
      if (!producersData.value) return {}
      
      const producerIds = [...producersData.value.miners, ...producersData.value.processors]
      const producerBuildings = buildingsData.value.filter(building => producerIds.includes(building.id))
      
      const grouped: { [key: number]: Item[] } = {}
      producerBuildings.forEach(item => {
        const row = item.row ?? 0
        if (!grouped[row]) {
          grouped[row] = []
        }
        grouped[row].push(item)
      })
      return grouped
    })
  }

  return {
    // Состояние
    buildingsData: computed(() => buildingsData.value),
    producersData: computed(() => producersData.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Методы
    loadBuildings,
    loadProducers,
    getItemById,
    getBuildingsByRow,
    getBuildingsGroupedByRow,
    getAllBuildings,
    getProducerBuildings,
    getProducerBuildingsGroupedByRow
  }
}