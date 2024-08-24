<script setup lang="ts">
import BoardView from "./components/BoardView.vue"
import TheHeader from "@/components/TheHeader.vue"



</script>

<template>
  <div class="App">
    <the-header />
    <board-view />
  </div>
</template>

<style scoped>
.App {
  width: 100%;
  height: 100vh;
}

</style>
