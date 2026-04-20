import { delay } from '../utils/delay'
import { ref, watch } from 'vue'
import { useBoardStore } from '@/modules/board'
import { defineStore, storeToRefs } from 'pinia'
import type { CellData, CoordsData, GraphRouteData, GraphTreeData } from '../types'
import { createQueue } from '../services/queue.service'
import { BOARD_COLS, BOARD_ROWS } from '../constants'

export const useExpansionStore = defineStore('expansion:store', () => {
    const boardStore = useBoardStore()
    const { boardCellsState, startCellCoords, targetCellCoords } = storeToRefs(boardStore)

    const isExpansionInProcess = ref(false)
    const isExpansionFinished = ref(false)

    const queue = createQueue<CellData>()
    let graphRoutes: GraphTreeData = {}

    const onStart = async () => {
        isExpansionInProcess.value = true
        queue.add(boardCellsState.value[startCellCoords.value.y][startCellCoords.value.x])
        graphRoutes = { [startCellCoords.value.index]: { value: startCellCoords.value } }

        while (!queue.empty()) {
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

        isExpansionInProcess.value = false
    }

    const computeNeighbour = (cell: CellData) => {
        const { coords: cellCoords, index } = cell
        const possibleNeighbours: CellData[] = []

        if (cellCoords.x - 1 > -1) {
            possibleNeighbours.push(boardCellsState.value[cellCoords.y][cellCoords.x - 1])
        }
        if (cellCoords.y + 1 < BOARD_ROWS) {
            possibleNeighbours.push(boardCellsState.value[cellCoords.y + 1][cellCoords.x])
        }
        if (cellCoords.x + 1 < BOARD_COLS) {
            possibleNeighbours.push(boardCellsState.value[cellCoords.y][cellCoords.x + 1])
        }
        if (cellCoords.y - 1 > -1) {
            possibleNeighbours.push(boardCellsState.value[cellCoords.y - 1][cellCoords.x])
        }
        if (!possibleNeighbours.length) return

        checkPossibleNeighbour(possibleNeighbours, index)
    }

    const checkPossibleNeighbour = (neighboursData: CellData[], parentIndex: number) => {
        neighboursData.forEach(neighbour => {
            if (!neighbour.isVisited && neighbour.type !== 'barrier') {
                neighbour.isExpansionProcess = true
                queue.add(neighbour)

                if (!graphRoutes[neighbour.index]) {
                    graphRoutes[neighbour.index] = {
                        value: neighbour.coords,
                        preRouteStepData: graphRoutes[parentIndex],
                    }
                }
            }
        })
    }

    const buildRoute = async (targetGraph?: GraphRouteData) => {
        if (!targetGraph) return
        const routeCoords: CoordsData[] = []
        while (targetGraph.preRouteStepData) {
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

    watch(() => [startCellCoords.value.index, targetCellCoords.value.index], () => {
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
        onReset,
    }
})
