import { ref, computed } from 'vue'
import type { Item } from '@/data-source/dto/item.dto'
import { useProducersStore } from '@/stores/producersStore'
import { useIconsStore } from '@/stores/iconsStore'
import { getBuildings, getComponents } from '@/api'
import { defineStore } from 'pinia'

export const useItemsStore = defineStore('items', () => {
    const buildings = ref<Item[]>([])
    const components = ref<Item[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const producersStore = useProducersStore()

    // const producersStore = useProducersStore()
    // const iconsStore = useIconsStore()

    async function loadItems() {
        if (buildings.value.length > 0) return // Уже загружены

        await getBuildings(isLoading, error).then((response) => (buildings.value = response))
        await getComponents(isLoading, error).then((response) => (components.value = response))
    }

    function getItemById(id: string) {
        const item = computed(() => {
            const building = buildings.value.find((item: Item) => {
                return item.id === id
            })

            if (building) return building

            return components.value.find((item: Item) => {
                return item.id === id
            })
        })

        if (!item.value) return undefined

        return item.value
    }

    function getBuildingsByRow(row: number) {
        return computed(() => buildings.value.filter((item: Item) => item.row === row))
    }

    function getBuildingsGroupedByRow() {
        return computed(() => {
            const grouped: { [key: number]: Item[] } = {}
            buildings.value.forEach((item) => {
                const row = item.row ?? 0
                if (!grouped[row]) {
                    grouped[row] = []
                }
                grouped[row].push(item)
            })
            return grouped
        })
    }

    // const getProducerBuildings = () => {
    //     return computed(() => {
    //         const producerIds = [
    //             ...producersStore.getAllMiners(),
    //             ...producersStore.getAllProcessors(),
    //         ]
    //         return buildings.value.filter((building) => producerIds.includes(building.id))
    //     })
    // }

    function getProducerBuildingsGroupedByRow() {
        return computed(() => {
            const producerIds = [
                ...producersStore.getAllMiners(),
                ...producersStore.getAllProcessors(),
            ]

            const producerBuildings = buildings.value.filter((building) =>
                producerIds.includes(building.id),
            )

            const grouped: { [key: number]: Item[] } = {}
            producerBuildings.forEach((item) => {
                const row = item.row ?? 0
                if (!grouped[row]) {
                    grouped[row] = []
                }
                grouped[row].push(item)
            })
            return grouped
        })
    }

    const getAllBuildings = computed(() => buildings.value)

    return {
        // Состояние
        isLoading,
        error,

        // Методы
        loadItems,
        getItemById,
        getBuildingsByRow,
        getBuildingsGroupedByRow,
        getProducerBuildingsGroupedByRow,

        getAllBuildings,
    }
})
