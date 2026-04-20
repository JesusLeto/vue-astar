<script setup lang="ts">
import CellView from './cell-view.vue'
import { useBoardStore, useEraserStore } from '@/modules/board'
import { storeToRefs } from 'pinia'
import type { CellData } from '../types'
import { useExpansionStore } from '@/modules/board'
import { useMouseAction } from '@/modules/board'

const boardStore = useBoardStore()
const { boardCellsState } = storeToRefs(boardStore)

const expansionStore = useExpansionStore()
const { isExpansionInProcess, isExpansionFinished } = storeToRefs(expansionStore)

const { onMouseAction, onMouseUp, isStartCellMove, isTargetCellMove, isPressMouseButton } = useMouseAction()
const { isEraserMode } = storeToRefs(useEraserStore())

function setCellSetting(data: CellData) {
    if (isExpansionInProcess.value || (data.type && data.type !== 'route')) return
    const currentType = isStartCellMove.value ? 'start' : isTargetCellMove.value ? 'target' : null
    boardStore.setCellSetting(data, currentType)
}

function eraseCell(data: CellData) {
    if (isExpansionInProcess.value) return
    boardStore.eraseBarrier(data)
}

function onCellMousedown(data: CellData) {
    if (isEraserMode.value) {
        eraseCell(data)
    } else {
        onMouseAction(data, setCellSetting, true)
    }
}

function onCellMousemove(data: CellData) {
    if (isEraserMode.value) {
        if (isPressMouseButton.value) eraseCell(data)
    } else {
        onMouseAction(data, setCellSetting)
    }
}
</script>

<template>
    <div
        class="grid grid-cols-board grid-rows-board gap-0 border border-table mx-auto h-fit w-fit select-none"
        :class="isEraserMode ? 'cursor-crosshair' : ''"
        @mouseup="onMouseUp"
        @dragstart.prevent
        @drop.prevent
    >
        <template v-for="(row, rowIndex) in boardCellsState" :key="rowIndex">
            <cell-view
                v-for="(data, index) in row"
                :key="index"
                :data="data"
                :is-expansion="!isExpansionFinished"
                :is-dragging="isStartCellMove || isTargetCellMove"
                :is-eraser-mode="isEraserMode"
                @mousedown="() => onCellMousedown(data)"
                @mousemove="() => onCellMousemove(data)"
            />
        </template>
    </div>
</template>
