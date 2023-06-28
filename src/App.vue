<script setup lang="ts">
import "./main.css"

import MainField from './components/MainField.vue';
import RadioGroup from "./components/RadioGroup.vue";
import { ref } from "vue";
import { CellType } from "./definitions/definitions";

const currentCellType = ref<CellType>(CellType.Empty)

</script>

<template>
  <div class="main">
    <RadioGroup 
      v-model="currentCellType"
    />
    <MainField 
      :currentCellType="currentCellType"
    />
  </div>
</template>

<style scoped>
</style>
