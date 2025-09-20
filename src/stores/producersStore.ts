import { getProducers } from '@/api'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

export const useProducersStore = defineStore('producers', () => {
    const producers = ref<ProducersData>({
        miners: [],
        processors: [],
    })
    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string | null> = ref(null)

    async function producersLoad() {
        if (producers.value?.miners?.length > 0 && producers.value?.processors?.length) return // Уже загружены

        isLoading.value = true
        error.value = null

        await getProducers(isLoading, error).then((response) => {
            producers.value = response
        })
    }

    function getAllMiners(): string[] {
        return producers.value?.miners || []
    }

    function getAllProcessors(): string[] {
        return producers.value?.processors || []
    }

    function isMiner(buildingId: string): boolean {
        return getAllMiners().includes(buildingId)
    }

    function isProcessor(buildingId: string): boolean {
        return getAllProcessors().includes(buildingId)
    }

    return {
        isLoading,
        error,

        producersLoad,
        getAllMiners,
        getAllProcessors,
        isMiner,
        isProcessor,
    }
})

interface ProducersData {
    miners: string[]
    processors: string[]
}
