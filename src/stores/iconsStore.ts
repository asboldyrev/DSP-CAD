import { defineStore } from 'pinia'
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { Icon } from '@/data-source/dto/icon.dto'
import { getIcons } from '@/api'

export const useIconsStore = defineStore('icons', () => {
    const icons: Ref<Icon[]> = ref([])

    const isLoading: Ref<boolean> = ref(false)
    const error: Ref<string | null> = ref(null)

    async function iconsLoad() {
        if (icons.value.length > 0) return // Уже загружены

        isLoading.value = true
        error.value = null

        await getIcons(isLoading, error).then((response) => {
            response.forEach((element: Icon) => {
                icons.value.push(element)
            })
        })
    }

    const getIconById = (id: string): ComputedRef<Icon | undefined> => {
        return computed(() => icons.value.find((icon: Icon) => icon.id === id))
    }

    const allIcons = computed(() => icons.value)

    return {
        isLoading,
        error,

        iconsLoad,
        getIconById,

        allIcons,
    }
})
