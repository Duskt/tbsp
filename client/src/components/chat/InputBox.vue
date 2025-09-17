<script setup>
import { ref } from 'vue'

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
    <div class="input-box">
      <form v-if="dayTime" @submit.prevent="send_message" class="chat-input">
        <input 
          v-model="new_message"
          required
          placeholder="Start typing..."
        />
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
  color: #FFFFFF;
}

</style>
