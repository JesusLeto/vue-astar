<script setup lang="ts">
import BoardView from "./components/board-view.vue"
import { CellType } from "./definitions/definitions"



</script>

<template>
  <div class="App">
    <!-- <RadioGroup
      v-model="currentCellType"
    /> -->
    <board-view
      :current-cell-type="CellType.Barrier"
    />
  </div>
</template>
<style scoped>
.App {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
}

</style>
