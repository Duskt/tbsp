<script setup>
import ChatBox from '@client/components/ChatBox.vue'
import GameInfo from '@client/components/GameInfo.vue'
import useWS from '@client/components/useWS.ts'
import { useRouter } from 'vue-router'

const router = useRouter()
const { ws } = useWS('/messages', (msg) => {
  if (!msg.data.startsWith('You')) {
    console.warn('Unknown WS message:', msg.data)
    return
  }
  router.push('/chatroom')
})
console.log(ws)
</script>

<template>
  <main class="flex-container">
    <GameInfo />
    <ChatBox :ws="ws" />
  </main>
</template>

<style scoped>
.flex-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  flex-direction: row;
  background-color: #535353;
}
</style>
