import { createRouter, createWebHistory } from 'vue-router';
import LobbyView from '../views/Lobby.vue';
import GameView from '../views/GameRoom.vue';

console.log(GameView);

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
      name: 'gameroom',
      component: GameView,
    },
  ],
});

export default router;
