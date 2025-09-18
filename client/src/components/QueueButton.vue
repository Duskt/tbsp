<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import { type Theme } from '../../../src/theme';

const { theme, ws } = defineProps<{ theme: Theme; ws: WebSocket }>();
let playersQueued = ref(0);

function joinQueue() {
  ws.send(theme.id);
}

</script>

<template>
  <button @click="joinQueue()">
    <span>{{ theme.name }}</span>
    <p>Players Queued: {{playersQueued}}</p>
  </button>
</template>

<style scoped>
</style>
