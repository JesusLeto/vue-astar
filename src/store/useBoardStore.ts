import { defineStore } from "pinia"
import {onMounted, ref} from "vue"
import type {CellData, Coords} from "@/definitions/definitions"
import {generateDefaultBoard} from "@/utils"
import {StartOrTargerType} from "@/definitions/definitions"
import { isEqual } from "lodash-es"

export const useBoardStore = defineStore("board:store", () => {
	const boardCellsState = ref<CellData[][]>([])

	// const historyBoardState = ref<{ old: CellData, new: CellData }[]>([])

	const startCellCoords = ref<Coords & { index: number }>({
		x: 0,
		y: 0,
		index: 0
	})

	const targetCellCoords = ref<Coords & { index: number }>({
		x: 0,
		y: 0,
		index: 0
	})

	onMounted(() => {
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
	})

	const setCellSetting = (cell: CellData, specialCell: StartOrTargerType | null = null) => {
		const { coord, index } = cell
		try {
			if (!specialCell) {
				boardCellsState.value[coord.y][coord.x].isBarrier = true
			}

			if (specialCell === StartOrTargerType.Start && !isEqual(startCellCoords, coord)) {
				boardCellsState.value[startCellCoords.value.y][startCellCoords.value.x].startOrTarget = null
				boardCellsState.value[coord.y][coord.x].startOrTarget = StartOrTargerType.Start
				startCellCoords.value = { ...coord, index }
			}

			if (specialCell === StartOrTargerType.Target && !isEqual(targetCellCoords, coord)) {
				boardCellsState.value[targetCellCoords.value.y][targetCellCoords.value.x].startOrTarget = null
				boardCellsState.value[coord.y][coord.x].startOrTarget = StartOrTargerType.Target
				targetCellCoords.value = { ...coord, index }
			}
		} catch (e) {
			console.error(e)
		}
	}

	return {
		startCellCoords,
		boardCellsState,
		setCellSetting
	}
})
