import { createRouter, createWebHistory } from 'vue-router'
import LobbyView from '../views/Lobby.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: LobbyView,
    },
    // should we be lazy loading components?
  ],
})

export default router
