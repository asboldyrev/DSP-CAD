import type { Ref } from 'vue'

export async function getIcons(isLoading: Ref, error: Ref<string | null>): Promise<any> {
    return request('/data/icons.json', isLoading, error)
}

export async function getRecipes(isLoading: Ref, error: Ref<string | null>): Promise<any> {
    return request('/data/recipes.json', isLoading, error)
}

export async function getProducers(isLoading: Ref, error: Ref<string | null>): Promise<any> {
    return request('/data/producers.json', isLoading, error)
}

export async function getBelts(isLoading: Ref, error: Ref<string | null>): Promise<any> {
    return request('/data/belts.json', isLoading, error)
}

export async function getItems(isLoading: Ref, error: Ref<string | null>): Promise<any> {
    return request('/data/items/buildings.json', isLoading, error)
}

async function request(url: string, isLoading: Ref, error: Ref<string | null>): Promise<any> {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
    } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to load data'
        console.error(`Error loading ${url}:`, err)
    } finally {
        isLoading.value = false
    }
}
