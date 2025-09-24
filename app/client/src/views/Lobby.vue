<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import QueueButton from '../components/QueueButton.vue'
import themes from '@tbsp/types/theme.ts'
const router = useRouter()

onMounted(() => {
console.log(wsCon, wsCon.ws);
wsCon.listen((e) => {
  console.log("got msg!!!", e);
  if (!e.data.msg.startsWith('You')) {
    console.warn('Unknown WS message:', e.data.msg)
    return
  }
  router.push('/chatroom')
})
console.log(wsCon);
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
