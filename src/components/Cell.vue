<script setup lang="ts">
import { computed } from 'vue';
import { CellType, type CellData } from '@/definitions';

const props = defineProps<{
  data: CellData
}>()

const cellColor = computed(() => {
  const cellStatus = props.data.status
  switch (cellStatus) {
    case CellType.Start:
      return "red"
    case CellType.Target: 
      return "orange"
    case CellType.Barrier:
      return "black"
    default:
      return "white"    
  }

})

</script>

<template>
  <div 
    class="cell"
    :style="{backgroundColor: cellColor}"
    >
  </div>
</template>

<style scoped>
.cell {
    width: 80px;
    height: 80px;
    text-align: center;
    border: 1px solid black;
    margin-right: 4px;
    margin-bottom: 4px;
}
</style>
