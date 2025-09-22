<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue'
import { useWsStore } from '@client/stores/websocket'
import { type WSChatMessage } from '@/wsapi/protocol'
// Unique ID counter
let id = 0
const dayTime = ref(true)
const new_message = ref('')
const chat_box = ref([{ id: id++, text: 'OGC' }])

const ws = useWsStore();

// function sends the chat message to the server
function send_message() {
  if (ws._ws.readyState === WebSocket.OPEN) {
    let chatMsg: WSChatMessage = {
      protocol_version: 1,
      kind: "chat",
      author: "0",
      msg: new_message.value,
      chatroomId: "0"
    }
    new_message.value = ''
  } else {
    console.warn('WebSocket not ready', ws._ws.readyState)
    wsStore.ws.onopen = () => {
      wsStore.ws.send(new_message.value)
    }
  }
}
</script>

<template>
  <div class="input-box">
    <form v-if="dayTime" @submit.prevent="send_message" class="chat-input">
      <input v-model="new_message" required placeholder="Start typing..." />
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
