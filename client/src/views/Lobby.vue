<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QueueButton from '../components/QueueButton.vue';
import useWS from '../components/useWS.ts';
import themes from '../../../src/theme.ts';

const { ws } = useWS('/');

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
