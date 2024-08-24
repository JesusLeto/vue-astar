<script setup lang="ts">
import CellView from "./CellView.vue"
import {useBoardStore} from "@/store/useBoardStore"
import {storeToRefs} from "pinia"
import type {CellData} from "@/types"
import {useExpansion} from "@/services/expansion.service"
import {useMouseAction} from "@/utils/composables/useMouseAction"

const boardStore = useBoardStore()
const { boardCellsState } = storeToRefs(boardStore)

const expansionService = useExpansion()
const { isExpansionInProcess, isExpansionFinished } = storeToRefs(expansionService)


const { onMouseAction, onMouseUp, isPressMouseButton, isStartCellMove, isTargetCellMove } = useMouseAction()

function setCellSetting(data: CellData) {
	if (isExpansionInProcess.value || (data.type && data.type !== 'route')) return
	const currentType = isStartCellMove.value ? 'start' : isTargetCellMove.value ? 'target' : null
	boardStore.setCellSetting(data, currentType)
}

</script>

<template>
  <div
      class="board"
      @mousedown="isPressMouseButton = true"
      @mouseup="onMouseUp"
      @dragstart="false"
      @drop="false"
  >
    <template
        v-for="row in boardCellsState"
    >
      <cell-view
          v-for="(data, index) in row"
          :key="index"
          :data="data"
          :is-expansion="!isExpansionFinished"
          @mousedown="() => onMouseAction(data, setCellSetting, true)"
          @mousemove="() => onMouseAction(data, setCellSetting)"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.board {
  display: grid;
  grid-template-columns: repeat(50, 32px);
  grid-template-rows: repeat(28, 32px);
  gap: 0;

  height: fit-content;
  width: fit-content;

  border: 1px solid $table-color;

  margin: auto;

}
</style>
