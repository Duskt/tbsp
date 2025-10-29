<script setup lang="ts">
import { ref } from 'vue';
import InputBox from '../chat/InputBox.vue';

const { ws } = defineProps<{ ws: WebSocket }>();

const id = ref<number>(0);
const dayTime = ref<boolean>(true);
const newMessage = ref<string>('');
const chatBox = ref<{ id: number; text: string; username: string }[]>([
  { id: id.value++, text: 'Created chatroom', username: 'LOBBY' },
]);

// this function receives a message from the server and updates the local chatBox array
ws.onmessage = (event) => {
  const { username, messageContent } = JSON.parse(event.data);
  chatBox.value.push({ id: id.value++, text: messageContent, username: username });
};

// to call if ws is broken?
async function requestMessages() {
  ws.send(JSON.stringify({ id: id.value }));
}
</script>

<template>
  <div class="chat-box">
    <ul class="chat-messages">
      <li v-for="message in chatBox" :key="message.id" class="chat-message">
        {{ message.username }}: {{ message.text }}
      </li>
    </ul>

    <InputBox :ws="ws" />
  </div>
</template>

<style scoped>
.chat-box {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1rem;
  /* box-sizing: border-box; */
  background-color: #3d3d3d;
  /* fill remaining space */
  flex: 1;
  overflow-y: auto;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  color: #ffffff;
  margin: 0 0 1rem 0;
  font-size: 12px;
}

.chat-message {
  margin-bottom: 5px;
  border-radius: 8px;
  max-width: 90%;
  align-self: flex-start;
  word-wrap: break-word;
}
</style>
