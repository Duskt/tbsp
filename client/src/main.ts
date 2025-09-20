import '@client/assets/main.css'
import { createApp } from 'vue'
import { createPinia, defineStore } from 'pinia'
import App from '@client/App.vue'
import router from '@client/router/index.ts'

export const store = defineStore('store', () => {
  return { ws: new WebSocket('/message') }
})
const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
