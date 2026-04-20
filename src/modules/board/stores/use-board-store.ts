import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateDefaultBoard } from '../utils/generate-default-board'
import type { CellData, CoordsData, CellType } from '../types'
import { isEqual } from '@/core/lib/is-equal.ts'
import { START_CELL_COORDS, TARGET_CELL_COORDS } from '../constants'

export const useBoardStore = defineStore('board:store', () => {
    const boardCellsState = ref<CellData[][]>(generateDefaultBoard())

    const startCellCoords = ref<CoordsData & { index: number }>({ ...START_CELL_COORDS })

    const targetCellCoords = ref<CoordsData & { index: number }>({ ...TARGET_CELL_COORDS })

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

    const reset = () => {
        boardCellsState.value = generateDefaultBoard()
        startCellCoords.value = { ...START_CELL_COORDS }
        targetCellCoords.value = { ...TARGET_CELL_COORDS }
    }

    return {
        startCellCoords,
        targetCellCoords,
        boardCellsState,
        setCellSetting,
        reset,
    }
})
