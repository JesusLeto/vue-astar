import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateDefaultBoard, getDefaultCoords } from '../utils/generate-default-board'
import type { CellData, CoordsData, CellType } from '../types'
import { isEqual } from '@/core/lib/is-equal.ts'
import { useBoardSettingsStore } from './use-board-settings-store'

export const useBoardStore = defineStore('board:store', () => {
    const settingsStore = useBoardSettingsStore()

    const makeDefaultCoords = () => getDefaultCoords(settingsStore.cols, settingsStore.rows)

    const { startCoords: initStart, targetCoords: initTarget } = makeDefaultCoords()

    const startCellCoords = ref<CoordsData & { index: number }>({ ...initStart, index: 0 })
    const targetCellCoords = ref<CoordsData & { index: number }>({
        ...initTarget,
        index: initTarget.y * settingsStore.cols + initTarget.x,
    })

    const boardCellsState = ref<CellData[][]>(
        generateDefaultBoard(settingsStore.cols, settingsStore.rows, initStart, initTarget),
    )

    const setCellSetting = (cell: CellData, currentType: CellType | null = null) => {
        const { coords, index } = cell

        try {
            const specialCell = currentType === 'start' || currentType === 'target'

            if (!specialCell) {
                boardCellsState.value[coords.y][coords.x].type = 'barrier'
            }

            if (currentType === 'start' && !isEqual(startCellCoords.value, coords)) {
                boardCellsState.value[startCellCoords.value.y][startCellCoords.value.x].type = ''
                boardCellsState.value[coords.y][coords.x].type = 'start'
                startCellCoords.value = { ...coords, index }
            }

            if (currentType === 'target' && !isEqual(targetCellCoords.value, coords)) {
                boardCellsState.value[targetCellCoords.value.y][targetCellCoords.value.x].type = ''
                boardCellsState.value[coords.y][coords.x].type = 'target'
                targetCellCoords.value = { ...coords, index }
            }
        } catch (e) {
            console.error(e)
        }
    }

    const eraseBarrier = (cell: CellData) => {
        if (cell.type === 'barrier') {
            boardCellsState.value[cell.coords.y][cell.coords.x].type = ''
        }
    }

    const reset = () => {
        const { startCoords, targetCoords } = makeDefaultCoords()
        startCellCoords.value = { ...startCoords, index: 0 }
        targetCellCoords.value = {
            ...targetCoords,
            index: targetCoords.y * settingsStore.cols + targetCoords.x,
        }
        boardCellsState.value = generateDefaultBoard(
            settingsStore.cols,
            settingsStore.rows,
            startCoords,
            targetCoords,
        )
    }

    return {
        startCellCoords,
        targetCellCoords,
        boardCellsState,
        setCellSetting,
        eraseBarrier,
        reset,
    }
})
