import { ref, computed } from 'vue'
import type { Item } from '@/types/Item'
import { useProducersStore } from './producersStore'
import { useIconsStore } from './iconsStore'

const buildingsData = ref<Item[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useItemsStore = () => {
  const producersStore = useProducersStore()
  const iconsStore = useIconsStore()
  
  const loadBuildings = async () => {
    if (buildingsData.value.length > 0) return // Уже загружены
    
    isLoading.value = true
    error.value = null
    
    try {
      // Загружаем и здания, и иконки параллельно
      const [buildingsResponse, iconsResponse] = await Promise.all([
        fetch('/data/Items/buildings.json'),
        fetch('/data/icons.json')
      ])
      
      if (!buildingsResponse.ok) throw new Error(`HTTP error! status: ${buildingsResponse.status}`)
      if (!iconsResponse.ok) throw new Error(`HTTP error! status: ${iconsResponse.status}`)
      
      const buildings = await buildingsResponse.json()
      const icons = await iconsResponse.json()
      
      // Загружаем иконки в iconsStore
      await iconsStore.loadIcons()
      
      // Добавляем иконки к зданиям
      buildingsData.value = buildings.map((building: Item) => ({
        ...building,
        icon: icons.find((icon: any) => icon.id === building.id)
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load buildings data'
      console.error('Error loading buildings:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadProducers = async () => {
    await producersStore.loadProducers()
  }

  const loadIcons = async () => {
    await iconsStore.loadIcons()
  }

  const getItemById = (id: string) => {
    const item = buildingsData.value.find((item: Item) => item.id === id)
    if (!item) return undefined
    
    // Если у айтема нет иконки, добавляем её
    if (!item.icon) {
      const icon = iconsStore.getAllIcons.value.find((icon: any) => icon.id === id)
      return {
        ...item,
        icon
      }
    }
    
    return item
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
      const producerIds = [...producersStore.getAllMiners(), ...producersStore.getAllProcessors()]
      return buildingsData.value.filter(building => producerIds.includes(building.id))
    })
  }

  const getProducerBuildingsGroupedByRow = () => {
    return computed(() => {
      const producerIds = [...producersStore.getAllMiners(), ...producersStore.getAllProcessors()]
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
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Методы
    loadBuildings,
    loadProducers,
    loadIcons,
    getItemById,
    getBuildingsByRow,
    getBuildingsGroupedByRow,
    getAllBuildings,
    getProducerBuildings,
    getProducerBuildingsGroupedByRow
  }
}