<script setup lang="ts">
import CellView from './cell-view.vue'
import { useBoardStore } from '../stores/use-board-store'
import { storeToRefs } from 'pinia'
import type { CellData } from '../types'
import { useExpansionStore } from '../stores/use-expansion-store'
import { useMouseAction } from '../composables/use-mouse-action'

const boardStore = useBoardStore()
const { boardCellsState } = storeToRefs(boardStore)

const expansionStore = useExpansionStore()
const { isExpansionInProcess, isExpansionFinished } = storeToRefs(expansionStore)

const { onMouseAction, onMouseUp, isPressMouseButton, isStartCellMove, isTargetCellMove } = useMouseAction()

function setCellSetting(data: CellData) {
    if (isExpansionInProcess.value || (data.type && data.type !== 'route')) return
    const currentType = isStartCellMove.value ? 'start' : isTargetCellMove.value ? 'target' : null
    boardStore.setCellSetting(data, currentType)
}
</script>

<template>
    <div
        class="grid grid-cols-board grid-rows-board gap-0 border border-table mx-auto h-fit w-fit"
        @mousedown="isPressMouseButton = true"
        @mouseup="onMouseUp"
        @dragstart="false"
        @drop="false"
    >
        <template v-for="row in boardCellsState">
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
