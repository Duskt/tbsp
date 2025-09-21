import { createRouter, createWebHistory } from 'vue-router'
import LobbyView from '@client/views/Lobby.vue'
import ChatView from '@client/views/GameRoom.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: LobbyView,
    },
    // should we be lazy loading components?
    {
      path: '/gameroom',
      name: 'gameroom',
      component: ChatView,
    },
  ],
})

export default router
