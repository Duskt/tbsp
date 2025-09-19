<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue'
// Unique ID counter
let id = 0;
const dayTime = ref(true);
const new_message = ref('');
const chat_box = ref([{id:id++, text:"OGC"}]);


const { ws } = defineProps<{ ws:WebSocket }>();
console.log("props.ws:", ws);
console.log("type:", typeof ws);
console.log("readyState:", ws.readyState);

function send_message() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(new_message.value);
  } else {
    console.warn('WebSocket not ready', ws.readyState);
    ws.onopen = () => {
      console.log("we send it anyway")
      ws.send(new_message.value);
      ws.send("Hello server!");
};
  }
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
