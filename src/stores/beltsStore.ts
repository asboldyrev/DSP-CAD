import { getBelts } from '@/api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBeltsStore = defineStore('belts', () => {
    const beltsData = ref<BeltsData | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    async function loadBelts() {
        if (beltsData.value) return // Уже загружены

        await getBelts(isLoading, error).then((response) => (beltsData.value = response))
    }

    function getAllBelts(): string[] {
        return beltsData.value?.belts || []
    }

    function getAllSorters(): string[] {
        return beltsData.value?.sorters || []
    }

    return {
        isLoading,
        error,

        loadBelts,
        getAllBelts,
        getAllSorters,
    }
})

interface BeltsData {
    belts: string[]
    sorters: string[]
}
