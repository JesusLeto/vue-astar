<script setup lang="ts">
import { computed } from 'vue'
import CellView from './cell-view.vue'
import { useBoardStore, useEraserStore } from '@/modules/board'
import { storeToRefs } from 'pinia'
import type { CellData } from '../types'
import { useExpansionStore } from '@/modules/board'
import { useMouseAction } from '@/modules/board'
import { useBoardSettingsStore } from '../stores/use-board-settings-store'

const boardStore = useBoardStore()
const { boardCellsState } = storeToRefs(boardStore)

const expansionStore = useExpansionStore()
const { isExpansionInProcess, isExpansionFinished } = storeToRefs(expansionStore)

const {
    onMouseAction,
    onMouseUp,
    isStartCellMove,
    isTargetCellMove,
    isBombCellMove,
    isPressMouseButton,
    isWeightKeyPressed,
    getMovedCellType,
} = useMouseAction()
const { isEraserMode, isWeightMode } = storeToRefs(useEraserStore())

const settingsStore = useBoardSettingsStore()
const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${settingsStore.cols}, 32px)`,
    gridTemplateRows: `repeat(${settingsStore.rows}, 32px)`,
}))

function setCellSetting(data: CellData) {
    if (isExpansionInProcess.value) return
    const currentType = getMovedCellType()
    if (!currentType && data.type && data.type !== 'route') return
    if (!currentType && isExpansionFinished.value) expansionStore.clearPath()
    const drawMode = isWeightMode.value || isWeightKeyPressed.value ? 'weight' : 'wall'
    boardStore.setCellSetting(data, currentType, drawMode)
}

function eraseCell(data: CellData) {
    if (isExpansionInProcess.value) return
    if (isExpansionFinished.value) expansionStore.clearPath()
    boardStore.eraseCell(data)
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
        class="grid gap-0 border border-table mx-auto h-fit w-fit select-none"
        :class="isEraserMode || isWeightMode ? 'cursor-crosshair' : ''"
        :style="gridStyle"
        @mouseup="onMouseUp"
        @dragstart.prevent
        @drop.prevent
    >
        <template
            v-for="(row, rowIndex) in boardCellsState"
            :key="rowIndex"
        >
            <cell-view
                v-for="(data, index) in row"
                :key="index"
                :data="data"
                :is-expansion="!isExpansionFinished"
                :is-dragging="isStartCellMove || isTargetCellMove || isBombCellMove"
                :is-eraser-mode="isEraserMode"
                :is-weight-mode="isWeightMode || isWeightKeyPressed"
                @mousedown="() => onCellMousedown(data)"
                @mousemove="() => onCellMousemove(data)"
            />
        </template>
    </div>
</template>
