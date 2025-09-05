import { ref, computed } from 'vue'
import type { Icon } from '@/types/Icon'

const iconsData = ref<Icon[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useIconsStore = () => {
  const loadIcons = async () => {
    if (iconsData.value.length > 0) return // Уже загружены
    
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch('/data/icons.json')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      iconsData.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load icons data'
      console.error('Error loading icons:', err)
    } finally {
      isLoading.value = false
    }
  }

  const getIconById = (id: string) => {
    return computed(() => iconsData.value.find((icon: Icon) => icon.id === id))
  }

  const getAllIcons = computed(() => iconsData.value)

  return {
    // Состояние
    iconsData: computed(() => iconsData.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Методы
    loadIcons,
    getIconById,
    getAllIcons
  }
}