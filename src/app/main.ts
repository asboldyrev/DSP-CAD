import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/app/App.vue'
import '@/app/style.css'
import 'remixicon/fonts/remixicon.css'

// Импортируем справочные сторы для загрузки
import { useIconsStore } from '@/stores/iconsStore'
import { useRecipesStore } from '@/stores/recipesStore'
import { useProducersStore } from '@/stores/producersStore'
import { useBeltsStore } from '@/stores/beltsStore'
import { useItemsStore } from '@/stores/itemsStore'

// Импортируем компоненты для глобальной регистрации
import GameIcon from '@/components/GameIcon.vue'
// import ItemCard from '@/components/ItemCard.vue'

const app = createApp(App)

app.use(createPinia())

// Регистрируем компоненты глобально
app.component('GameIcon', GameIcon)
// app.component('ItemCard', ItemCard)

const { iconsLoad } = useIconsStore()
const { recipesLoad } = useRecipesStore()
const { producersLoad } = useProducersStore()
const { loadBelts } = useBeltsStore()
const { loadBuildings } = useItemsStore()

await iconsLoad()
await recipesLoad()
await producersLoad()
await loadBelts()
await loadBuildings()

app.mount('#app')
