import { delay } from '../utils/delay'
import { ref, watch } from 'vue'
import { useBoardStore } from '@/modules/board'
import { defineStore, storeToRefs } from 'pinia'
import type { CellData, CoordsData, GraphRouteData, GraphTreeData } from '../types'
import { bfsAlgorithm } from '../algorithms/bfs.algorithm'
import type { PathfindingAlgorithm, PathfindingFrontier } from '../algorithms'
import { useBoardSettingsStore } from './use-board-settings-store'

export const useExpansionStore = defineStore('expansion:store', () => {
    const boardStore = useBoardStore()
    const settingsStore = useBoardSettingsStore()
    const { boardCellsState, startCellCoords, targetCellCoords } = storeToRefs(boardStore)

    const isExpansionInProcess = ref(false)
    const isExpansionFinished = ref(false)

    let algorithm: PathfindingAlgorithm = bfsAlgorithm
    let frontier: PathfindingFrontier = algorithm.createFrontier()
    let graphRoutes: GraphTreeData = {}

    const setAlgorithm = (newAlgorithm: PathfindingAlgorithm) => {
        frontier.clean()
        algorithm = newAlgorithm
        frontier = algorithm.createFrontier()
    }

    const onStart = async () => {
        isExpansionInProcess.value = true
        graphRoutes = { [startCellCoords.value.index]: { value: startCellCoords.value } }
        frontier.add(boardCellsState.value[startCellCoords.value.y][startCellCoords.value.x])

        while (!frontier.empty()) {
            const cell = frontier.get()
            if (!cell) break
            const { coords: currentCellCoords } = cell
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

            computeNeighbours(currentCell)
        }

        isExpansionInProcess.value = false
    }

    const computeNeighbours = (cell: CellData) => {
        const { coords: cellCoords, index } = cell
        const possibleNeighbours: CellData[] = []

        if (cellCoords.x - 1 > -1) {
            possibleNeighbours.push(boardCellsState.value[cellCoords.y][cellCoords.x - 1])
        }
        if (cellCoords.y + 1 < settingsStore.rows) {
            possibleNeighbours.push(boardCellsState.value[cellCoords.y + 1][cellCoords.x])
        }
        if (cellCoords.x + 1 < settingsStore.cols) {
            possibleNeighbours.push(boardCellsState.value[cellCoords.y][cellCoords.x + 1])
        }
        if (cellCoords.y - 1 > -1) {
            possibleNeighbours.push(boardCellsState.value[cellCoords.y - 1][cellCoords.x])
        }
        if (!possibleNeighbours.length) return

        enqueueNeighbours(possibleNeighbours, cell, index)
    }

    const enqueueNeighbours = (neighboursData: CellData[], parent: CellData, parentIndex: number) => {
        neighboursData.forEach(neighbour => {
            if (!neighbour.isVisited && neighbour.type !== 'barrier') {
                neighbour.isExpansionProcess = true
                algorithm.enqueueNeighbor(frontier, neighbour, parent, targetCellCoords.value)

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
        frontier.clean()
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
        frontier.clean()
        boardStore.reset()
    }

    return {
        onStart,
        isExpansionInProcess,
        isExpansionFinished,
        onReset,
        setAlgorithm,
    }
})
