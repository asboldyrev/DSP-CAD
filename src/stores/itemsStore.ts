import { ref, computed } from 'vue'
import type { Item } from '@/types/Item'

const itemsData = ref<Item[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useItemsStore = () => {
  const loadItems = async () => {
    if (itemsData.value.length > 0) return // Уже загружены
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch('/data/items.json')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      itemsData.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load items data'
      console.error('Error loading items:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getItemById = (id: string) => {
    return computed(() => itemsData.value.find((item: Item) => item.id === id))
  }

  const getItemsByCategory = (category: string) => {
    return computed(() => itemsData.value.filter((item: Item) => item.category === category))
  }

  const getAllItems = computed(() => itemsData.value)

  return {
    // Состояние
    itemsData: computed(() => itemsData.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Методы
    loadItems,
    getItemById,
    getItemsByCategory,
    getAllItems
  }
}