<script setup lang="ts">
import { RouterView } from 'vue-router';
import { palette } from './style';
</script>

<template ref="app">
  <RouterView :class="$style.app" />
</template>

<style module>
.app {
  background-color: v-bind('palette.black[0]');
}
</style>
