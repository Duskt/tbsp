<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const day = ref<number>(1);
const role = ref<string>('MAFIA');
const players = ref<number>(16);
const endTime = ref<number>(Date.now() + 5 * 60 * 1000);
const now = ref<number>(Date.now());

let intervalId: number | NodeJS.Timeout;

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now();
    if (now.value >= endTime.value) {
      clearInterval(intervalId);
    }
  }, 1000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});

// Time remaining in seconds
const timeLeft = computed(() => {
  const diff = endTime.value - now.value;
  return diff > 0 ? Math.floor(diff / 1000) : 0;
});

function showTime() {
  let minute = Math.floor(timeLeft.value / 60);
  let second = timeLeft.value % 60;
  return `${String(minute).padStart(1, '0')}:${String(second).padStart(2, '0')}`;
}
</script>

<template>
  <div class="info-bar">
    <h1>YOU ARE</h1>
    <div class="role-icon">
      <p>{{ role }}</p>
    </div>
    <p>Day: {{ day }}</p>
    <p>Time until nightfall: {{ showTime() }}</p>
    <p>Players remaining: {{ players }}</p>
  </div>
</template>

<style scoped>
h1 {
  font-family: 'kanit';
  text-align: center;
  font-size: 100;
  font-weight: bold;
  color: #ffffff;
}

.role-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #d9d9d9;
  height: 25vw;
  width: 25vw;
}

.role-icon p {
  font-family: 'kanit';
  color: #960b22;
  text-align: center;
  font-size: 70pt;
}

p {
  color: #ffffff;
  text-align: center;
  font-size: 40;
  margin: 10;
}

.info-bar {
  display: flex;
  align-items: center;
  flex-direction: column;
  height: 100vh;
  width: 30vw;
}
</style>
