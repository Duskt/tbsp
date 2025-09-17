<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import { type Theme } from '../../../src/theme';

const props = defineProps<{ theme: Theme; ws: WebSocket }>();
let playersQueued = ref(0);

function joinQueue() {
  console.log(props.ws);
  props.ws.send(props.theme.id);
}

</script>

<template>
  <button @click="joinQueue()">
    <span>{{ props.theme.name }}</span>
    <p>Players Queued: {{playersQueued}}</p>
    <RouterLink to="/chatroom">link text</RouterLink>
  </button>
</template>

<style scoped>
</style>
