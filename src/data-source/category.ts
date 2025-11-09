import type { Icon } from './dto/icon.dto'

export class Category {
    categories: CategoryInfo[] = [
        {
            id: 'components',
            name: 'Components',
            icon: 'components',
        },
        {
            id: 'buildings',
            name: 'Buildings',
            icon: 'buildings',
        },
        {
            id: 'technologies',
            name: 'Technologies',
            icon: 'technologies',
        },
        {
            id: 'upgrades',
            name: 'Upgrades',
            icon: 'upgrades',
        },
    ]

    id: string
    name: string
    icon: string | undefined | Icon

    constructor(id: string) {
        const category = this.getById(id)

        this.id = category.id
        this.name = category.name
        this.icon = category.icon
    }

    getAll(): CategoryInfo[] {
        return this.categories
    }

    getById(id: string): CategoryInfo {
        const category = this.categories.find((c) => c.id === id)

        if (!category) {
            throw new Error(`Category with id ${id} not found`)
        }

        return category
    }
}

export interface CategoryInfo {
    id: string
    name: string
    icon?: string | Icon
}
