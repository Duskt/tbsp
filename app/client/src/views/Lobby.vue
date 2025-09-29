<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import QueueButton from '../components/QueueButton.vue'
import themes from '@tbsp/mafia/theme.ts'
import ws from '../ws'
const router = useRouter()

onMounted(() => {
ws.onmessage((e) => {
  console.log("got msg!!!", e);
  if (e.data.kind !== "queue") {
    console.warn(`Unexpected message received of kind ${e.data.kind}`);
    return;
  }
  router.push('/chatroom')
})
})
</script>

<template>
  <ol>
    <li v-for="t in themes">
      <QueueButton :theme="t" />
    </li>
  </ol>
</template>

<style scoped>
ol {
  height: 100%;
  width: 100%;
  padding-block: 10%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

li {
  display: flex;
  justify-content: center;
}
</style>
