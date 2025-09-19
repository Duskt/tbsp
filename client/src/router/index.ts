import { createRouter, createWebHistory } from 'vue-router'
import LobbyView from '../views/Lobby.vue'
import ChatView from '../views/ChatRoom.vue'





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
      path: '/chatroom',
      name: 'chatroom',
      component: ChatView,
    },
  ],
})

export default router
