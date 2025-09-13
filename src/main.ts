import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import 'remixicon/fonts/remixicon.css'

// Импортируем компоненты для глобальной регистрации
import GameIcon from './components/GameIcon.vue'
import ItemCard from './components/ItemCard.vue'
import BaseButton from './components/BaseButton.vue'

const app = createApp(App)

app.use(createPinia())

// Регистрируем компоненты глобально
app.component('GameIcon', GameIcon)
app.component('ItemCard', ItemCard)
app.component('BaseButton', BaseButton)
app.mount('#app')
