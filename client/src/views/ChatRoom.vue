<script setup>
import ChatBox from '@client/components/ChatBox.vue'
import GameInfo from '@client/components/GameInfo.vue'
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
