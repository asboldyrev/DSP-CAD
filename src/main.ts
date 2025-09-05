import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// Импортируем компоненты для глобальной регистрации
import GameIcon from './components/GameIcon.vue'
import ItemCard from './components/ItemCard.vue'

const app = createApp(App)

app.use(createPinia())

// Регистрируем компоненты глобально
app.component('GameIcon', GameIcon)
app.component('ItemCard', ItemCard)

app.mount('#app')
