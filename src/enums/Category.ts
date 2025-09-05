export enum Category {
  COMPONENTS = 'components',
  BUILDINGS = 'buildings',
  TECHNOLOGIES = 'technologies',
  UPGRADES = 'upgrades'
}

export interface CategoryInfo {
  id: Category
  name: string
  icon?: string
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: Category.COMPONENTS,
    name: 'Components'
  },
  {
    id: Category.BUILDINGS,
    name: 'Buildings'
  },
  {
    id: Category.TECHNOLOGIES,
    name: 'Technologies',
    icon: 'mission-completed'
  },
  {
    id: Category.UPGRADES,
    name: 'Upgrades',
    icon: 'mecha-core-6'
  }
]