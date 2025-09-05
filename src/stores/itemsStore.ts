import { ref, computed } from 'vue'
import type { Item } from '@/types/Item'

const buildingsData = ref<Item[]>([])
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

  return {
    // Состояние
    buildingsData: computed(() => buildingsData.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Методы
    loadBuildings,
    getItemById,
    getBuildingsByRow,
    getBuildingsGroupedByRow,
    getAllBuildings
  }
}