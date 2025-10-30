<script setup lang="ts">
import { ref } from 'vue';

const { ws } = defineProps<{ ws: WebSocket }>();

const id = ref<number>(0);
const dayTime = ref<boolean>(true);
const newMessage = ref<string>('');
const chatBox = ref([{ id: id.value++, text: 'OGC' }]);

// function sends the chat message to the server
function sendMessage() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(newMessage.value);
    newMessage.value = '';
  } else {
    console.warn('WebSocket not ready', ws.readyState);
    ws.onopen = () => {
      ws.send(newMessage.value);
    };
  }
}
</script>

<template>
  <div class="input-box">
    <form v-if="dayTime" @submit.prevent="sendMessage" class="chat-input">
      <input v-model="newMessage" required placeholder="Start typing..." />
    </form>
  </div>
</template>

<style scoped>
.chat-input {
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #535353;
  color: #ffffff;
}
</style>
