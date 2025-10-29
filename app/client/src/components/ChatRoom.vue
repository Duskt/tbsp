<script setup>
import { useRouter } from 'vue-router';
import ChatBox from '../components/chat/ChatBox.vue';
import ChatSelectionBar from '../components/chat/ChatSelectionBar.vue';
import useWS from '../components/useWS.ts';

const router = useRouter();

const { ws } = useWS('/messages', (msg) => {
  if (!msg.data.startsWith('You')) {
    console.warn('Unknown WS message:', msg.data);
    return;
  }
  router.push('/chatroom');
});

console.log(ws);
</script>

<template>
  <ChatRoomArea class="chat-room-area">
    <ChatSelectionBar />
    <ChatBox :ws="ws" />
  </ChatRoomArea>
</template>

<style scoped>
.chat-room-area {
  display: flex;
  height: 100vh;
  width: 70vw;
  flex-direction: column;
}
</style>
