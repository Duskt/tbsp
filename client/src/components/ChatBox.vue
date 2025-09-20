<script setup lang="ts">
import { ref } from 'vue'
import { User } from '@/user'
import { Message } from '@/message'
import InputBox from '@client/components/chat/InputBox.vue'
// Unique ID counter

let id = 0;
const dayTime = ref(true);
const new_message = ref('');
const chat_box = ref([{id:id++, text:"Created chatroom", username:"LOBBY"}]);
const { ws } = defineProps<{ ws: WebSocket }>();

// this function receives a message from the server and updates the local chat_box array
ws.onmessage = (event) => {
    const { username, messageContent } = JSON.parse(event.data);
    chat_box.value.push({id:id++, text:messageContent, username:username})
}
// to call if ws is broken?
async function requestMessages() {
  ws.send(JSON.stringify({id:id}))
}
</script>

<template>
    <div class="chat-box">
      <ul class="chat-messages">
        <li
          v-for="message in chat_box"
          :key="message.id"
          class="chat-message"
        >
          {{message.username}}: {{ message.text }}
        </li>
      </ul>

      <InputBox :ws='ws'/>
    </div>
</template>

<style scoped>


.chat-box {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100vh;
  width:70vw; 
  padding: 1rem;
  box-sizing: border-box;
  background-color: #0000005f;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  color: #FFFFFF;
  margin: 0 0 1rem 0;
}

.chat-message {
  margin-bottom: 5px;
  border-radius: 8px;
  max-width: 90%;
  align-self: flex-start;
  word-wrap: break-word;
}
</style>
