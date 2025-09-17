<script setup lang="ts">
import QueueButton from '../components/QueueButton.vue';
import themes from '../../../src/theme.ts';
// doesn't need to be dynamically updated
const ws = new WebSocket('/');
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
