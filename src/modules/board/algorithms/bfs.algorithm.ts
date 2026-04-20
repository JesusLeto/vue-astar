import type { CellData } from '../types'
import type { PathfindingAlgorithm, PathfindingFrontier } from './algorithm.types'

const createBfsFrontier = (): PathfindingFrontier => {
    let data: CellData[] = []

    return {
        add: (cell) => data.push(cell),
        get: () => data.shift(),
        empty: () => !data.length,
        clean: () => { data = [] },
    }
}

export const bfsAlgorithm: PathfindingAlgorithm = {
    createFrontier: createBfsFrontier,
    enqueueNeighbor: (frontier, neighbor) => frontier.add(neighbor),
}
