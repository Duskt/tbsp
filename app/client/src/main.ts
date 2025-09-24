import './assets/main.css';
import { createApp } from 'vue';
import { createPinia, defineStore } from 'pinia';
import App from './App.vue';
import router from './router/index.ts';

export const store = defineStore('store', () => {
  return { ws: new WebSocket('/messages') };
});
const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
