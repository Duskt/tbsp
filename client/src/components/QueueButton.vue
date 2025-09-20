<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { type Theme } from '@/theme'
import palette from '@client/style.ts'

const { theme, ws } = defineProps<{ theme: Theme; ws: WebSocket }>()
let playersQueued = ref(0)

function joinQueue() {
  ws.send(theme.id)
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
