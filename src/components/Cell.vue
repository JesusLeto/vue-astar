<script setup lang="ts">
import { computed } from 'vue';
import { CellType, type CellData } from '@/definitions/definitions';

const props = defineProps<{
  data: CellData
}>()

const cellColor = computed(() => {
  const cellStatus = props.data.status
  if (props.data.isVisited) return "blue"
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
    width: 20px;
    height: 20px;
    text-align: center;
    border: 1px solid rgb(146, 146, 146);
    margin-right: 1px;
    margin-bottom: 1px;
}
</style>

// 1 + 21 * 40 = 841
