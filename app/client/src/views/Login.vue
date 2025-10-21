<script setup>
import LoginBox from '../components/LoginBox.vue';
</script>

<template>
  <main class="flex-container">
    <LoginBox />
  </main>
</template>

<style scoped>
.flex-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #535353;
}
</style>
