<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ theme: String; }>();
let playersQueued = ref(0);

</script>

<template>
  <button @click="playersQueued++">
    <span>{{ props.theme }}</span>
    <p>Players Queued: {{playersQueued}}</p>
  </button>
</template>

<style scoped>
</style>
