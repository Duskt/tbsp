<script setup lang="ts">
import QueueButton from '../components/QueueButton.vue';
// doesn't need to be dynamically updated
const queues = ['Vanilla', 'Another'];
</script>

<template>
  <main>
    <table>
      <tr v-for="q in queues">
        <td>
          <QueueButton :theme="q"/>
        </td>
      </tr>
    </table>
  </main>
</template>
