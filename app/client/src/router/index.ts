import { createRouter, createWebHistory } from 'vue-router';
import GameView from '../views/GameRoom.vue';
import LobbyView from '../views/Lobby.vue';

console.log(GameView);

export const router = createRouter({
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
