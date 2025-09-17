<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router'

const props = defineProps<{ theme: String; }>();
let playersQueued = ref(0);

</script>

<template>
  <button @click="playersQueued++">
    <span>{{ props.theme }}</span>
    <p>Players Queued: {{playersQueued}}</p>
    <RouterLink to="/chatroom">link text</RouterLink>
  </button>
</template>

<style scoped>
</style>
