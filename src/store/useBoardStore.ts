import { defineStore } from "pinia"
import {onMounted, ref} from "vue"
import {generateDefaultBoard} from "@/utils"
import { isEqual } from "lodash-es"
import type {CellData, CoordsData, CellType} from "@/types"

export const useBoardStore = defineStore("board:store", () => {
	const boardCellsState = ref<CellData[][]>([])

	// const historyBoardState = ref<{ old: CellData, new: CellData }[]>([])

	const startCellCoords = ref<CoordsData & { index: number }>({
		x: 0,
		y: 0,
		index: 0
	})

	const targetCellCoords = ref<CoordsData & { index: number }>({
		x: 0,
		y: 0,
		index: 0
	})

	const setCellSetting = (cell: CellData, currentType: CellType | null = null) => {
		const { coords, index } = cell

		try {
			const specialCell = currentType === 'start' || currentType === 'target'

			if (!specialCell) {
				boardCellsState.value[coords.y][coords.x].type = 'barrier'
			}

			if (currentType === 'start' && !isEqual(startCellCoords, coords)) {
				boardCellsState.value[startCellCoords.value.y][startCellCoords.value.x].type = ''
				boardCellsState.value[coords.y][coords.x].type = 'start'
				startCellCoords.value = { ...coords, index }
			}

			if (currentType === 'target' && !isEqual(targetCellCoords, coords)) {
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
		startCellCoords.value = {
			x: 0,
			y: 0,
			index: 0
		}
		targetCellCoords.value = {
			x: 40,
			y: 20,
			index: 1040
		}
	}

	onMounted(reset)

	return {
		startCellCoords,
		targetCellCoords,
		boardCellsState,
		setCellSetting,
		reset
	}
})
