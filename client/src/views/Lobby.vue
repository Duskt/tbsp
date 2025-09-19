<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

import QueueButton from '../components/QueueButton.vue';
import useWS from '../components/useWS.ts';

import themes from '../../../src/theme.ts';

const router = useRouter();
const { ws } = useWS('/', (msg) => {
  if (! msg.data.startsWith('You')) { console.warn("Unknown WS message:", msg.data); return }
  router.push('/chatroom');
});

</script>

<template>
  <ol>
    <li v-for="t in themes">
      <QueueButton :ws="ws" :theme="t"/>
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
