<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue'
// Unique ID counter
let id = 0
const dayTime = ref(true)
const newMessage = ref('')
const chat_box = ref([{ id: id++, text: 'OGC' }])

function sendMessage() {
  wsCon.send({
    protocol_version: 1,
    kind: "chat",
    author: "0",
    msg: newMessage.value,
    chatroomId: "0"
  });
  newMessage.value = '';
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
