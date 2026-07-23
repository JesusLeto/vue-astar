import { delay } from '../utils/delay'
import { ref, watch } from 'vue'
import { useBoardStore } from '@/modules/board'
import { defineStore, storeToRefs } from 'pinia'
import type { CoordsData } from '../types'
import type { PathfindingAlgorithm, PathfindingResult } from '../algorithms'
import { bfsAlgorithm } from '../algorithms'

export type VisualizationSpeed = 'fast' | 'average' | 'slow'

const VISIT_DELAYS: Record<VisualizationSpeed, number> = {
    fast: 0,
    average: 100,
    slow: 500,
}

const ROUTE_DELAY = 40

export const useExpansionStore = defineStore('expansion:store', () => {
    const boardStore = useBoardStore()
    const { boardCellsState, startCellCoords, targetCellCoords, bombCellCoords } = storeToRefs(boardStore)

    const isExpansionInProcess = ref(false)
    const isExpansionFinished = ref(false)
    const currentAlgorithm = ref<PathfindingAlgorithm>(bfsAlgorithm)
    const speed = ref<VisualizationSpeed>('fast')

    const setAlgorithm = (newAlgorithm: PathfindingAlgorithm) => {
        currentAlgorithm.value = newAlgorithm
        if (!newAlgorithm.supportsBomb) boardStore.removeBomb()
        if (!newAlgorithm.weighted) boardStore.clearWeights()
        if (isExpansionFinished.value) {
            isExpansionFinished.value = false
            boardStore.clearSearchState()
        }
    }

    const setSpeed = (newSpeed: VisualizationSpeed) => {
        speed.value = newSpeed
    }

    const animateVisited = async (visited: CoordsData[], instant: boolean) => {
        for (const coords of visited) {
            const cell = boardCellsState.value[coords.y]?.[coords.x]
            if (!cell || cell.type === 'start' || cell.type === 'target' || cell.type === 'bomb') continue
            cell.isVisited = true
            cell.isExpansionProcess = true
            if (!instant) await delay(VISIT_DELAYS[speed.value])
        }
    }

    const animateRoute = async (route: CoordsData[], instant: boolean) => {
        for (const coords of route) {
            const cell = boardCellsState.value[coords.y]?.[coords.x]
            if (!cell || cell.type === 'start' || cell.type === 'target' || cell.type === 'bomb') continue
            cell.type = 'route'
            if (!instant) await delay(ROUTE_DELAY)
        }
    }

    const runSegment = async (start: CoordsData, target: CoordsData, instant: boolean): Promise<PathfindingResult> => {
        const result = currentAlgorithm.value.run(boardCellsState.value, start, target)
        await animateVisited(result.visited, instant)
        if (result.found) await animateRoute(result.route, instant)
        return result
    }

    const onStart = async (instant = false) => {
        if (isExpansionInProcess.value) return
        isExpansionInProcess.value = true
        isExpansionFinished.value = false
        boardStore.clearSearchState()

        const checkpoints =
            bombCellCoords.value && currentAlgorithm.value.supportsBomb
                ? [bombCellCoords.value, targetCellCoords.value]
                : [targetCellCoords.value]
        let currentStart: CoordsData = startCellCoords.value

        for (const checkpoint of checkpoints) {
            const result = await runSegment(currentStart, checkpoint, instant)
            if (!result.found) {
                isExpansionInProcess.value = false
                return
            }
            currentStart = checkpoint
        }

        isExpansionInProcess.value = false
        isExpansionFinished.value = true
    }

    watch(
        () => [startCellCoords.value.index, targetCellCoords.value.index, bombCellCoords.value?.index ?? -1],
        () => {
            if (!isExpansionFinished.value || isExpansionInProcess.value) return
            void onStart(true)
        }
    )

    const clearPath = () => {
        isExpansionFinished.value = false
        boardStore.clearSearchState()
    }

    const onReset = () => {
        isExpansionFinished.value = false
        boardStore.reset()
    }

    return {
        onStart,
        isExpansionInProcess,
        isExpansionFinished,
        currentAlgorithm,
        speed,
        clearPath,
        onReset,
        setAlgorithm,
        setSpeed,
    }
})
