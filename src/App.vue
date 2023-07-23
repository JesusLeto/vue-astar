<script setup lang="ts">
import "./main.css"

import Board from './components/Board.vue';
import RadioGroup from "./components/RadioGroup.vue";
import { ref } from "vue";
import { CellType } from "./definitions/definitions";

const currentCellType = ref<CellType>(CellType.Empty)

</script>

<template>
  <div class="App">
    <!-- <RadioGroup 
      v-model="currentCellType"
    /> -->
    <Board 
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
