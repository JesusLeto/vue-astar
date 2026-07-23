import type { CellData, CoordsData } from '../types'
import type { PathfindingAlgorithm, PathfindingResult } from './algorithm.types'

type WeightedStrategy = 'dijkstra' | 'astar' | 'greedy' | 'swarm' | 'convergentSwarm'

interface QueueEntry {
    index: number
    priority: number
    order: number
}

class PriorityQueue {
    private entries: QueueEntry[] = []
    private order = 0

    add(index: number, priority: number): void {
        this.entries.push({ index, priority, order: this.order++ })
        this.entries.sort((a, b) => a.priority - b.priority || a.order - b.order)
    }

    get(): number | undefined {
        return this.entries.shift()?.index
    }

    get empty(): boolean {
        return this.entries.length === 0
    }
}

const coordsToIndex = (coords: CoordsData, cols: number): number => coords.y * cols + coords.x

const indexToCoords = (index: number, cols: number): CoordsData => ({
    x: index % cols,
    y: Math.floor(index / cols),
})

const manhattanDistance = (a: CoordsData, b: CoordsData): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

const isTraversable = (cell: CellData): boolean => cell.type !== 'barrier'

const getCellByIndex = (cells: CellData[][], index: number): CellData | undefined => {
    const cols = cells[0]?.length ?? 0
    if (!cols) return undefined
    const y = Math.floor(index / cols)
    const x = index % cols
    return cells[y]?.[x]
}

const getNeighbors = (cell: CellData, cells: CellData[][]): CellData[] => {
    const rows = cells.length
    const cols = cells[0]?.length ?? 0
    const { x, y } = cell.coords
    const candidates: CoordsData[] = [
        { x, y: y - 1 },
        { x: x + 1, y },
        { x, y: y + 1 },
        { x: x - 1, y },
    ]

    return candidates
        .filter(coords => coords.x >= 0 && coords.x < cols && coords.y >= 0 && coords.y < rows)
        .map(coords => cells[coords.y]![coords.x]!)
        .filter(isTraversable)
}

const movementCost = (cell: CellData, weighted: boolean): number => {
    if (!weighted) return 1
    return cell.weight > 0 ? cell.weight : 1
}

const reconstructRoute = (
    previous: readonly (number | null)[],
    startIndex: number,
    targetIndex: number,
    cols: number
): CoordsData[] => {
    const route: CoordsData[] = []
    let current = previous[targetIndex] ?? null

    while (current !== null && current !== startIndex) {
        route.push(indexToCoords(current, cols))
        current = previous[current] ?? null
    }

    return route.reverse()
}

const reconstructPathIndexes = (
    previous: readonly (number | null)[],
    startIndex: number,
    targetIndex: number
): number[] => {
    const route: number[] = []
    let current: number | null = targetIndex

    while (current !== null) {
        route.push(current)
        if (current === startIndex) return route.reverse()
        current = previous[current] ?? null
    }

    return []
}

const createEmptyResult = (): PathfindingResult => ({
    found: false,
    visited: [],
    route: [],
})

const createNullableNumberArray = (size: number): Array<number | null> =>
    Array.from({ length: size }, (): number | null => null)

const createNumberArray = (size: number, value: number): number[] => Array.from({ length: size }, (): number => value)

function runUnweightedSearch(
    cells: CellData[][],
    start: CoordsData,
    target: CoordsData,
    depthFirst: boolean
): PathfindingResult {
    const cols = cells[0]?.length ?? 0
    const size = cols * cells.length
    const startIndex = coordsToIndex(start, cols)
    const targetIndex = coordsToIndex(target, cols)
    const previous = createNullableNumberArray(size)
    const visited = new Set<number>([startIndex])
    const pending: number[] = [startIndex]
    const visitedCoords: CoordsData[] = []

    while (pending.length) {
        const currentIndex = depthFirst ? pending.pop() : pending.shift()
        if (currentIndex === undefined) break
        const currentCell = getCellByIndex(cells, currentIndex)
        if (!currentCell) continue
        if (currentIndex !== startIndex) visitedCoords.push(currentCell.coords)
        if (currentIndex === targetIndex) {
            return {
                found: true,
                visited: visitedCoords,
                route: reconstructRoute(previous, startIndex, targetIndex, cols),
            }
        }

        getNeighbors(currentCell, cells).forEach(neighbor => {
            if (visited.has(neighbor.index)) return
            visited.add(neighbor.index)
            previous[neighbor.index] = currentIndex
            pending.push(neighbor.index)
        })
    }

    return { ...createEmptyResult(), visited: visitedCoords }
}

const getWeightedPriority = (strategy: WeightedStrategy, distance: number, cost: number, heuristic: number): number => {
    if (strategy === 'dijkstra') return distance
    if (strategy === 'astar') return distance + heuristic
    if (strategy === 'greedy') return heuristic + cost
    if (strategy === 'convergentSwarm') return distance + Math.pow(heuristic, 2) + cost
    return distance + cost * Math.max(1, heuristic)
}

const shouldCompareByPriority = (strategy: WeightedStrategy): boolean =>
    strategy === 'greedy' || strategy === 'swarm' || strategy === 'convergentSwarm'

function runWeightedSearch(
    cells: CellData[][],
    start: CoordsData,
    target: CoordsData,
    strategy: WeightedStrategy
): PathfindingResult {
    const cols = cells[0]?.length ?? 0
    const size = cols * cells.length
    const startIndex = coordsToIndex(start, cols)
    const targetIndex = coordsToIndex(target, cols)
    const previous = createNullableNumberArray(size)
    const distance = createNumberArray(size, Infinity)
    const bestScore = createNumberArray(size, Infinity)
    const closed = new Set<number>()
    const queue = new PriorityQueue()
    const visitedCoords: CoordsData[] = []

    distance[startIndex] = 0
    bestScore[startIndex] = 0
    queue.add(startIndex, 0)

    while (!queue.empty) {
        const currentIndex = queue.get()
        if (currentIndex === undefined || closed.has(currentIndex)) continue
        const currentCell = getCellByIndex(cells, currentIndex)
        if (!currentCell) continue
        closed.add(currentIndex)
        if (currentIndex !== startIndex) visitedCoords.push(currentCell.coords)
        if (currentIndex === targetIndex) {
            return {
                found: true,
                visited: visitedCoords,
                route: reconstructRoute(previous, startIndex, targetIndex, cols),
            }
        }

        getNeighbors(currentCell, cells).forEach(neighbor => {
            if (closed.has(neighbor.index)) return
            const cost = movementCost(neighbor, true)
            const nextDistance = distance[currentIndex]! + cost
            const heuristic = manhattanDistance(neighbor.coords, target)
            const priority = getWeightedPriority(strategy, nextDistance, cost, heuristic)
            const compareScore = shouldCompareByPriority(strategy) ? priority : nextDistance
            if (compareScore >= bestScore[neighbor.index]!) return
            distance[neighbor.index] = nextDistance
            bestScore[neighbor.index] = compareScore
            previous[neighbor.index] = currentIndex
            queue.add(neighbor.index, priority)
        })
    }

    return { ...createEmptyResult(), visited: visitedCoords }
}

function takeNextOpen(queue: PriorityQueue, closed: ReadonlySet<number>): number | undefined {
    while (!queue.empty) {
        const index = queue.get()
        if (index !== undefined && !closed.has(index)) return index
    }
    return undefined
}

function expandBidirectionalSide(
    currentIndex: number,
    targetCoords: CoordsData,
    cells: CellData[][],
    queue: PriorityQueue,
    distance: number[],
    bestScore: number[],
    previous: Array<number | null>,
    ownClosed: Set<number>,
    otherClosed: ReadonlySet<number>
): number | null {
    const currentCell = getCellByIndex(cells, currentIndex)
    if (!currentCell) return null
    ownClosed.add(currentIndex)
    if (otherClosed.has(currentIndex)) return currentIndex

    getNeighbors(currentCell, cells).forEach(neighbor => {
        if (ownClosed.has(neighbor.index)) return
        const cost = movementCost(neighbor, true)
        const nextDistance = distance[currentIndex]! + cost
        const heuristic = manhattanDistance(neighbor.coords, targetCoords)
        const priority = getWeightedPriority('swarm', nextDistance, cost, heuristic)
        if (priority >= bestScore[neighbor.index]!) return
        distance[neighbor.index] = nextDistance
        bestScore[neighbor.index] = priority
        previous[neighbor.index] = currentIndex
        queue.add(neighbor.index, priority)
    })

    return null
}

function buildBidirectionalRoute(
    previousFromStart: readonly (number | null)[],
    previousFromTarget: readonly (number | null)[],
    startIndex: number,
    targetIndex: number,
    meetingIndex: number,
    cols: number
): CoordsData[] {
    const startHalf = reconstructPathIndexes(previousFromStart, startIndex, meetingIndex)
    if (!startHalf.length) return []
    const targetHalf: number[] = []
    let cursor = meetingIndex

    while (cursor !== targetIndex) {
        const next = previousFromTarget[cursor] ?? null
        if (next === null) return []
        targetHalf.push(next)
        cursor = next
    }

    return [...startHalf, ...targetHalf]
        .filter(index => index !== startIndex && index !== targetIndex)
        .map(index => indexToCoords(index, cols))
}

function runBidirectionalSwarm(cells: CellData[][], start: CoordsData, target: CoordsData): PathfindingResult {
    const cols = cells[0]?.length ?? 0
    const size = cols * cells.length
    const startIndex = coordsToIndex(start, cols)
    const targetIndex = coordsToIndex(target, cols)
    const startQueue = new PriorityQueue()
    const targetQueue = new PriorityQueue()
    const startClosed = new Set<number>()
    const targetClosed = new Set<number>()
    const startPrevious = createNullableNumberArray(size)
    const targetPrevious = createNullableNumberArray(size)
    const startDistance = createNumberArray(size, Infinity)
    const targetDistance = createNumberArray(size, Infinity)
    const startBestScore = createNumberArray(size, Infinity)
    const targetBestScore = createNumberArray(size, Infinity)
    const visitedCoords: CoordsData[] = []

    startDistance[startIndex] = 0
    targetDistance[targetIndex] = 0
    startBestScore[startIndex] = 0
    targetBestScore[targetIndex] = 0
    startQueue.add(startIndex, 0)
    targetQueue.add(targetIndex, 0)

    while (!startQueue.empty && !targetQueue.empty) {
        const fromStart = takeNextOpen(startQueue, startClosed)
        if (fromStart === undefined) break
        if (fromStart !== startIndex) visitedCoords.push(indexToCoords(fromStart, cols))
        const startMeeting = expandBidirectionalSide(
            fromStart,
            target,
            cells,
            startQueue,
            startDistance,
            startBestScore,
            startPrevious,
            startClosed,
            targetClosed
        )
        if (startMeeting !== null) {
            return {
                found: true,
                visited: visitedCoords,
                route: buildBidirectionalRoute(
                    startPrevious,
                    targetPrevious,
                    startIndex,
                    targetIndex,
                    startMeeting,
                    cols
                ),
            }
        }

        const fromTarget = takeNextOpen(targetQueue, targetClosed)
        if (fromTarget === undefined) break
        if (fromTarget !== targetIndex) visitedCoords.push(indexToCoords(fromTarget, cols))
        const targetMeeting = expandBidirectionalSide(
            fromTarget,
            start,
            cells,
            targetQueue,
            targetDistance,
            targetBestScore,
            targetPrevious,
            targetClosed,
            startClosed
        )
        if (targetMeeting !== null) {
            return {
                found: true,
                visited: visitedCoords,
                route: buildBidirectionalRoute(
                    startPrevious,
                    targetPrevious,
                    startIndex,
                    targetIndex,
                    targetMeeting,
                    cols
                ),
            }
        }
    }

    return { ...createEmptyResult(), visited: visitedCoords }
}

export const bfsAlgorithm: PathfindingAlgorithm = {
    id: 'bfs',
    label: 'BFS',
    weighted: false,
    guaranteesShortestPath: true,
    supportsBomb: true,
    run: (cells, start, target) => runUnweightedSearch(cells, start, target, false),
}

export const dfsAlgorithm: PathfindingAlgorithm = {
    id: 'dfs',
    label: 'DFS',
    weighted: false,
    guaranteesShortestPath: false,
    supportsBomb: true,
    run: (cells, start, target) => runUnweightedSearch(cells, start, target, true),
}

export const dijkstraAlgorithm: PathfindingAlgorithm = {
    id: 'dijkstra',
    label: "Dijkstra's",
    weighted: true,
    guaranteesShortestPath: true,
    supportsBomb: true,
    run: (cells, start, target) => runWeightedSearch(cells, start, target, 'dijkstra'),
}

export const astarAlgorithm: PathfindingAlgorithm = {
    id: 'astar',
    label: 'A*',
    weighted: true,
    guaranteesShortestPath: true,
    supportsBomb: true,
    run: (cells, start, target) => runWeightedSearch(cells, start, target, 'astar'),
}

export const greedyAlgorithm: PathfindingAlgorithm = {
    id: 'greedy',
    label: 'Greedy Best-first',
    weighted: true,
    guaranteesShortestPath: false,
    supportsBomb: true,
    run: (cells, start, target) => runWeightedSearch(cells, start, target, 'greedy'),
}

export const swarmAlgorithm: PathfindingAlgorithm = {
    id: 'swarm',
    label: 'Swarm',
    weighted: true,
    guaranteesShortestPath: false,
    supportsBomb: true,
    run: (cells, start, target) => runWeightedSearch(cells, start, target, 'swarm'),
}

export const convergentSwarmAlgorithm: PathfindingAlgorithm = {
    id: 'convergentSwarm',
    label: 'Convergent Swarm',
    weighted: true,
    guaranteesShortestPath: false,
    supportsBomb: true,
    run: (cells, start, target) => runWeightedSearch(cells, start, target, 'convergentSwarm'),
}

export const bidirectionalSwarmAlgorithm: PathfindingAlgorithm = {
    id: 'bidirectionalSwarm',
    label: 'Bidirectional Swarm',
    weighted: true,
    guaranteesShortestPath: false,
    supportsBomb: false,
    run: runBidirectionalSwarm,
}

export const pathfindingAlgorithms = [
    dijkstraAlgorithm,
    astarAlgorithm,
    greedyAlgorithm,
    swarmAlgorithm,
    convergentSwarmAlgorithm,
    bidirectionalSwarmAlgorithm,
    bfsAlgorithm,
    dfsAlgorithm,
] as const satisfies readonly PathfindingAlgorithm[]
