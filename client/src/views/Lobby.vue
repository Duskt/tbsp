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
  <main>
    <table>
      <tr v-for="t in themes">
        <td>
          <QueueButton :ws="ws" :theme="t"/>
        </td>
      </tr>
    </table>
  </main>
</template>
