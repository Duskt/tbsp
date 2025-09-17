<script setup>
import ChatBox from "../components/ChatBox.vue"
import GameInfo from "../components/GameInfo.vue"

</script>

<template>
  <main class=flex-container>

    <GameInfo/>
    <ChatBox/>
    
  </main>
</template>


<style scoped>

.flex-container{
  display: flex;
  width:100vw;
  height:100vh;
  flex-direction: row;
  background-color: #535353;
}
</style>