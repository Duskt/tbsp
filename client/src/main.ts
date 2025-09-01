import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

class WS extends WebSocket {
    onmessage = (e: MessageEvent) => {
	console.log(e.data);
    }
}

document.addEventListener('DOMContentLoaded', (e) => {
    console.log('all working on the client-side!');
    const ws = new WS('/');
    console.log(ws);
    ws.addEventListener('message', ws.onmessage);
}, {once: true});
