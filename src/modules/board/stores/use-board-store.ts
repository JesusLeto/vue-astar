import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateDefaultBoard, getDefaultCoords } from '../utils/generate-default-board'
import { CELL_WEIGHT } from '../constants'
import type { CellData, CellSpecialType, CoordsData } from '../types'
import { useBoardSettingsStore } from './use-board-settings-store'
import { generateMazePattern, type MazePattern } from '../utils/maze-generators'

export type DrawMode = 'wall' | 'weight'
export type IndexedCoords = CoordsData & { index: number }

const isProtectedCell = (cell: CellData): boolean =>
    cell.type === 'start' || cell.type === 'target' || cell.type === 'bomb'

export const useBoardStore = defineStore('board:store', () => {
    const settingsStore = useBoardSettingsStore()

    const makeDefaultCoords = () => getDefaultCoords(settingsStore.cols, settingsStore.rows)
    const toIndexedCoords = (coords: CoordsData): IndexedCoords => ({
        ...coords,
        index: coords.y * settingsStore.cols + coords.x,
    })

    const { startCoords: initStart, targetCoords: initTarget } = makeDefaultCoords()

    const startCellCoords = ref<IndexedCoords>(toIndexedCoords(initStart))
    const targetCellCoords = ref<IndexedCoords>(toIndexedCoords(initTarget))
    const bombCellCoords = ref<IndexedCoords | null>(null)

    const boardCellsState = ref<CellData[][]>(
        generateDefaultBoard(settingsStore.cols, settingsStore.rows, initStart, initTarget)
    )

    const getCell = (coords: CoordsData): CellData | undefined => boardCellsState.value[coords.y]?.[coords.x]

    const getSpecialCoords = (type: CellSpecialType): IndexedCoords | null => {
        if (type === 'start') return startCellCoords.value
        if (type === 'target') return targetCellCoords.value
        return bombCellCoords.value
    }

    const setSpecialCoords = (type: CellSpecialType, coords: IndexedCoords | null) => {
        if (type === 'start' && coords) startCellCoords.value = coords
        if (type === 'target' && coords) targetCellCoords.value = coords
        if (type === 'bomb') bombCellCoords.value = coords
    }

    const clearSearchState = () => {
        boardCellsState.value.forEach(row => {
            row.forEach(cell => {
                cell.isExpansionProcess = false
                cell.isVisited = false
                if (cell.type === 'route') cell.type = ''
            })
        })
    }

    const moveSpecialCell = (type: CellSpecialType, cell: CellData) => {
        if (cell.type === 'barrier' || (isProtectedCell(cell) && cell.type !== type)) return
        const currentCoords = getSpecialCoords(type)
        if (!currentCoords || currentCoords.index === cell.index) return
        const currentCell = getCell(currentCoords)
        if (currentCell) currentCell.type = ''
        cell.type = type
        cell.weight = 0
        cell.isExpansionProcess = false
        cell.isVisited = false
        setSpecialCoords(type, { ...cell.coords, index: cell.index })
    }

    const setCellSetting = (
        cell: CellData,
        currentType: CellSpecialType | null = null,
        drawMode: DrawMode = 'wall'
    ) => {
        if (currentType) {
            moveSpecialCell(currentType, cell)
            return
        }

        if (isProtectedCell(cell)) return
        cell.type = drawMode === 'wall' ? 'barrier' : ''
        cell.weight = drawMode === 'weight' ? CELL_WEIGHT : 0
        cell.isExpansionProcess = false
        cell.isVisited = false
    }

    const eraseCell = (cell: CellData) => {
        if (isProtectedCell(cell)) return
        cell.type = ''
        cell.weight = 0
        cell.isExpansionProcess = false
        cell.isVisited = false
    }

    const addBomb = () => {
        if (bombCellCoords.value) return
        const preferredCoords = toIndexedCoords({
            x: Math.max(0, Math.min(settingsStore.cols - 1, Math.floor(settingsStore.cols / 2))),
            y: Math.max(0, Math.min(settingsStore.rows - 1, Math.floor(settingsStore.rows / 2))),
        })
        const preferredCell = getCell(preferredCoords)
        const cell =
            preferredCell && !isProtectedCell(preferredCell)
                ? preferredCell
                : boardCellsState.value.flat().find(item => !isProtectedCell(item) && item.type !== 'barrier')
        if (!cell) return
        clearSearchState()
        cell.type = 'bomb'
        cell.weight = 0
        bombCellCoords.value = { ...cell.coords, index: cell.index }
    }

    const removeBomb = () => {
        if (!bombCellCoords.value) return
        const cell = getCell(bombCellCoords.value)
        if (cell?.type === 'bomb') cell.type = ''
        bombCellCoords.value = null
        clearSearchState()
    }

    const toggleBomb = () => {
        if (bombCellCoords.value) removeBomb()
        else addBomb()
    }

    const clearWallsAndWeights = () => {
        clearSearchState()
        boardCellsState.value.forEach(row => {
            row.forEach(cell => {
                if (isProtectedCell(cell)) return
                cell.type = ''
                cell.weight = 0
            })
        })
    }

    const clearWeights = () => {
        clearSearchState()
        boardCellsState.value.forEach(row => {
            row.forEach(cell => {
                if (!isProtectedCell(cell)) cell.weight = 0
            })
        })
    }

    const setBarrier = (cell: CellData) => {
        if (isProtectedCell(cell)) return
        cell.type = 'barrier'
        cell.weight = 0
    }

    const setWeight = (cell: CellData) => {
        if (isProtectedCell(cell) || cell.type === 'barrier') return
        cell.type = ''
        cell.weight = CELL_WEIGHT
    }

    const getProtectedIndexes = (): Set<number> => {
        const indexes = new Set<number>([startCellCoords.value.index, targetCellCoords.value.index])
        if (bombCellCoords.value) indexes.add(bombCellCoords.value.index)
        return indexes
    }

    const applyMazePattern = (pattern: MazePattern) => {
        clearWallsAndWeights()
        generateMazePattern(settingsStore.rows, settingsStore.cols, getProtectedIndexes(), pattern).forEach(item => {
            const cell = getCell(item.coords)
            if (!cell) return
            if (item.type === 'barrier') setBarrier(cell)
            else setWeight(cell)
        })
    }

    const reset = () => {
        const { startCoords, targetCoords } = makeDefaultCoords()
        startCellCoords.value = toIndexedCoords(startCoords)
        targetCellCoords.value = toIndexedCoords(targetCoords)
        bombCellCoords.value = null
        boardCellsState.value = generateDefaultBoard(settingsStore.cols, settingsStore.rows, startCoords, targetCoords)
    }

    return {
        startCellCoords,
        targetCellCoords,
        bombCellCoords,
        boardCellsState,
        setCellSetting,
        eraseCell,
        addBomb,
        removeBomb,
        toggleBomb,
        clearSearchState,
        clearWallsAndWeights,
        clearWeights,
        setBarrier,
        setWeight,
        applyMazePattern,
        reset,
    }
})
