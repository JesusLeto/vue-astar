import { delay } from "@/utils/delay"
import {computed, ref, watch} from "vue"
import {useBoardStore} from "@/store/useBoardStore"
import {defineStore, storeToRefs} from "pinia"
import type {CellData, CoordsData, GraphRouteData, GraphTreeData} from "@/types"
import {QueueState} from "@/services/queue.service"

export const useExpansion = defineStore('expansion:store', () => {
	const boardStore = useBoardStore()
	const { boardCellsState, startCellCoords, targetCellCoords } = storeToRefs(boardStore)

	const isStopped = ref(false)

	const isExpansionInProcess = ref(false)
	const isExpansionFinished = ref(false)

	const queue = QueueState<CellData>()
	let graphRoutes: GraphTreeData = {}

	const onStart = async () => {
		isExpansionInProcess.value = true
		queue.add(boardCellsState.value[startCellCoords.value.y][startCellCoords.value.x])
		graphRoutes = {[startCellCoords.value.index]: {value: startCellCoords.value}}

		while (!queue.empty() && !isStopped.value) {
			const { coords: currentCellCoords } = queue.get() as CellData
			const currentCell = boardCellsState.value[currentCellCoords.y][currentCellCoords.x]
			if (currentCell.isVisited) continue
			if (currentCell.type === 'target') {
				await buildRoute(graphRoutes[currentCell.index].preRouteStepData)
				return
			}

			currentCell.isVisited = true

			if (startCellCoords.value.index !== currentCell.index) currentCell.isExpansionProcess = true

			if (!isExpansionFinished.value) {
				await delay(1)
			}

			computeNeighbour(currentCell)
		}
	}

	const computeNeighbour = (cell: CellData) => {
		const {coords: cellCoords, index} = cell
		const possibleNeighbours: CellData[] = []

		if (cellCoords.x - 1 > -1) {
			possibleNeighbours.push(boardCellsState.value[cellCoords.y][cellCoords.x - 1])
		}
		if (cellCoords.y + 1 < 28) {
			possibleNeighbours.push(boardCellsState.value[cellCoords.y + 1][cellCoords.x])
		}
		if (cellCoords.x + 1 < 50) {
			possibleNeighbours.push(boardCellsState.value[cellCoords.y][cellCoords.x + 1])
		}
		if (cellCoords.y - 1 > -1) {
			possibleNeighbours.push(boardCellsState.value[cellCoords.y - 1][cellCoords.x])
		}
		if (!possibleNeighbours.length) return

		checkPossibleNeighbour(possibleNeighbours, index)
	}

	const checkPossibleNeighbour = (nieghboursData: CellData[], parentIndex: number) => {
		nieghboursData.forEach(nieghbour => {
			if(!nieghbour.isVisited && nieghbour.type !== 'barrier') {
				nieghbour.isExpansionProcess = true
				queue.add(nieghbour)

				graphRoutes[nieghbour.index] = {
					value: nieghbour.coords,
					preRouteStepData: graphRoutes[parentIndex]
				}
			}
		})
	}

	const buildRoute = async (targetGraph?: GraphRouteData) => {
		if (!targetGraph) return
		const routeCoords: CoordsData[] = []
		while(targetGraph.preRouteStepData) {
			routeCoords.push(targetGraph.value)
			targetGraph = targetGraph.preRouteStepData
		}

		for (const rCoords of routeCoords.reverse()) {
			boardCellsState.value[rCoords.y][rCoords.x].type = 'route'
			if (!isExpansionFinished.value) {
				await delay(25)
			}
		}

		isExpansionInProcess.value = false
		isExpansionFinished.value = true
	}

	const isChangedStartOrTargetIndex = computed(() => startCellCoords.value.index + targetCellCoords.value.index)
	watch(isChangedStartOrTargetIndex, () => {
		if (!isExpansionFinished.value) return
		queue.clean()
		boardCellsState.value.forEach(row => {
			row.forEach(cell => {
				cell.isExpansionProcess = false
				cell.isVisited = false
				if (cell.type === 'route') cell.type = ''
			})
		})
		onStart()
	})

	const onReset = () => {
		isExpansionFinished.value = false
		queue.clean()
		boardStore.reset()
	}

	return {
		onStart,
		isExpansionInProcess,
		isExpansionFinished,
		onReset
	}
})
