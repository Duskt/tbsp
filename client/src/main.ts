import '@client/assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@client/App.vue'
import router from '@client/router/index.ts'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
