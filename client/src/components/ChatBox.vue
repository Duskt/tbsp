<script setup>
import { ref } from 'vue'
import InputBox from './chat/InputBox.vue'
// Unique ID counter
let id = 0;
const dayTime = ref(true);
const new_message = ref('');
const chat_box = ref([{id:id++, text:"OGC"}]);

function send_message() {
  chat_box.value.push({ id: id++, text: new_message.value });
  new_message.value = '';
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
          {{ message.text }}
        </li>
      </ul>

      <InputBox/>
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
