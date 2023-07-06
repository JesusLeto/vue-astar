<script setup lang="ts">
import { computed } from 'vue';
import { CellType, type CellData, ExpansionType } from '@/definitions/definitions';

const props = defineProps<{
  data: CellData
}>()

const cellColor = computed(() => {
  const cellStatus = props.data.status
  const cellExpandStatus = props.data.expansionStatus

  switch (cellStatus) {
    case CellType.Start:
      return "red"
    case CellType.Target: 
      return "orange"
    case CellType.Barrier:
      return "black"
    case CellType.Route:
      return "gold"
  }

  switch(cellExpandStatus) {
      case ExpansionType.Expanded:
        return "#ffd8b1"
      case ExpansionType.Processed:
        return "aqua"
      default:
        return ""
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
