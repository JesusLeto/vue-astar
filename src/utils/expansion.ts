import {
	type CellData,
	type GraphTreeData,
	type GraphRouteData,
	StartOrTargerType,
	type Coords
} from "@/definitions/definitions"
import { delay } from "./delay"
import {ref} from "vue"
import {useBoardStore} from "@/store/useBoardStore"
import {storeToRefs} from "pinia"

export const useExpansion = () => {
	const boardStore = useBoardStore()
	const { boardCellsState,startCellCoords } = storeToRefs(boardStore)

	const isStopped = ref(false)

	const queue: CellData[] = []
	let graphRoutes: GraphTreeData = {}

	const onStart = async () => {
		// debugger;
		queue.push(boardCellsState.value[startCellCoords.value.y][startCellCoords.value.x])
		graphRoutes = {[startCellCoords.value.index]: {value: startCellCoords.value}}

		while (queue.length && !isStopped.value) {
			const { coord: currentCellCoords } = queue.shift() as CellData
			const currentCell = boardCellsState.value[currentCellCoords.y][currentCellCoords.x]
			if (currentCell.isVisited) continue
			if (currentCell.startOrTarget === StartOrTargerType.Target) {
				await buildRoute(graphRoutes[currentCell.index])
				//isProcessing.value = false
				return
			}

			currentCell.isVisited = true

			if (startCellCoords.value.index !== currentCell.index) currentCell.isExpansionProcess = true

			await delay(1)

			computeNeighbour(currentCell)
		}
	}

	const computeNeighbour = (cell: CellData) => {
		const {coord: cellCoords, index} = cell
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
			if(!nieghbour.isVisited && !nieghbour.isBarrier) {
				nieghbour.isExpansionProcess = true
				queue.push(nieghbour)

				graphRoutes[nieghbour.index] = {
					value: nieghbour.coord,
					preRouteStepData: graphRoutes[parentIndex]
				}
			}
		})
	}


	const buildRoute = async (targetGraph: GraphRouteData) => {
		const routeCoords: Coords[] = []
		while(targetGraph.preRouteStepData) {
			routeCoords.push(targetGraph.value)
			targetGraph = targetGraph.preRouteStepData
		}

		for (const rCoords of routeCoords.reverse()) {
			boardCellsState.value[rCoords.y][rCoords.x].isRoute = true
			await delay(25)
		}
	}

	return {
		onStart
	}
}


// class Expansion {
//
// 	private data:  CellData[][] = []
// 	private graphRoutes: GraphTreeData = {}
//
// 	private startCell: CellData = initStartValue()
//
// 	private delayTime: number = 1
// 	private isStopped = false
//
// 	setup(data: CellData[][], startCell: CellData) {
// 		this.data = data
// 		this.startCell = startCell
//
// 		Queue.add(this.startCell)
// 		this.graphRoutes = {[startCell.index]: {value: startCell.coord}}
// 	}
//
// 	async start () {
// 		this.isStopped = false
// 		while (!Queue.empty() && !this.isStopped) {
// 			//while (this.isStopped) {}
// 			const {coord: currentCellCoords} = Queue.get() as CellData
//
// 			const currentCell = this.data[currentCellCoords.y][currentCellCoords.x]
//
// 			if (currentCell.isVisited) continue
// 			if (currentCell.startOrTarger === StartOrTargerType.Target) {
// 				await this.buildRoute(this.graphRoutes[currentCell.index])
//
// 				//isProcessing.value = false
// 				return
// 			}
//
// 			currentCell.isVisited = true
//
// 			if (this.startCell.index !== currentCell.index) currentCell.isExpansionProcess = true
//
// 			await delay(this.delayTime)
//
// 			this.computeNeighbour(currentCell)
//
// 			// if (this.startCell.index !== currentCell.index)  {
// 			//     currentCell.expansionStatus = ExpansionType.Expanded
// 			// }
//
// 		}
// 	}
//
// 	computeNeighbour(cell: CellData) {
// 		const {coord: cellCoords, index} = cell
// 		const possibleNeighbours: CellData[] = []
//
// 		if (cellCoords.x - 1 > -1) {
// 			possibleNeighbours.push(this.data[cellCoords.y][cellCoords.x - 1])
// 		}
// 		if (cellCoords.y + 1 < 28) {
// 			possibleNeighbours.push(this.data[cellCoords.y + 1][cellCoords.x])
// 		}
// 		if (cellCoords.x + 1 < 50) {
// 			possibleNeighbours.push(this.data[cellCoords.y][cellCoords.x + 1])
// 		}
// 		if (cellCoords.y - 1 > -1) {
// 			possibleNeighbours.push(this.data[cellCoords.y - 1][cellCoords.x])
// 		}
// 		if (!possibleNeighbours.length) return
//
// 		this.checkPossibleNeighbour(possibleNeighbours, index)
// 	}
//
// 	checkPossibleNeighbour(nieghboursData: CellData[], parentIndex: number) {
// 		nieghboursData.forEach(nieghbour => {
// 			if(!nieghbour.isVisited && !nieghbour.isBarrier) {
// 				nieghbour.isExpansionProcess = true
// 				Queue.add(nieghbour)
//
// 				this.graphRoutes[nieghbour.index] = {
// 					value: nieghbour.coord,
// 					preRouteStepData: this.graphRoutes[parentIndex]
// 				}
// 			}
// 		})
// 	}
//
//
// 	async buildRoute(targetGraph: GraphRouteData | undefined) {
// 		if (!targetGraph) return
// 		const routeCoords: coords[] = []
// 		while(targetGraph.preRouteStepData) {
// 			routeCoords.push(targetGraph.value)
// 			targetGraph = targetGraph.preRouteStepData
// 		}
//
// 		for (const rCoords of routeCoords.reverse()) {
// 			this.data[rCoords.y][rCoords.x].isRoute = true
// 			await delay(25)
// 		}
// 	}
//
// 	stop() {
// 		this.isStopped = true
// 	}
//
// 	setDelayTime(time: number) {
// 		this.delayTime = time
// 	}
// }
//
// export default new Expansion()
