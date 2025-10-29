<script setup lang="ts">
import { type Theme } from '@tbsp/mafia/theme.ts';
import { ref } from 'vue';
import { palette } from '../style.ts';
import { ws } from '../ws';

const { theme } = defineProps<{ theme: Theme }>();

const playersQueued = ref<number>(0);

function joinQueue() {
  ws.send({ kind: 'global.queue', protocolVersion: 1, theme: theme.id });
}
</script>

<template>
  <button @click="joinQueue()">
    <span>{{ theme.name }}</span>
    <p>Players Queued: {{ playersQueued }}</p>
  </button>
</template>

<style scoped>
button {
  background-color: v-bind('palette.black[1]');
  padding: 8px 24px;
  border: none;
}

span {
  color: white;
  font-size: 24px;
  font-family: 'Kanit';
}

p {
  color: v-bind('palette.black[3]');
  font-size: 12px;
  padding-bottom: 8px;
}
</style>
