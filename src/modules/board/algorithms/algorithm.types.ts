import type { CellData, CoordsData } from '../types'

export type PathfindingAlgorithmId =
    | 'bfs'
    | 'dfs'
    | 'dijkstra'
    | 'astar'
    | 'greedy'
    | 'swarm'
    | 'convergentSwarm'
    | 'bidirectionalSwarm'

export interface PathfindingResult {
    found: boolean
    visited: CoordsData[]
    route: CoordsData[]
}

export interface PathfindingAlgorithm {
    id: PathfindingAlgorithmId
    label: string
    weighted: boolean
    guaranteesShortestPath: boolean
    supportsBomb: boolean
    run(cells: CellData[][], start: CoordsData, target: CoordsData): PathfindingResult
}
