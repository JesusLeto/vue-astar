import type { CellData, CoordsData } from '../types'

export interface PathfindingFrontier {
    add(cell: CellData, priority?: number): void
    get(): CellData | undefined
    empty(): boolean
    clean(): void
}

export interface PathfindingAlgorithm {
    createFrontier(): PathfindingFrontier
    enqueueNeighbor(frontier: PathfindingFrontier, neighbor: CellData, parent: CellData, targetCoords: CoordsData): void
}
