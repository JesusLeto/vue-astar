import type { CellData, CoordsData } from '../types'
import type { PathfindingAlgorithm, PathfindingFrontier } from './algorithm.types'

interface PriorityEntry {
    cell: CellData
    priority: number
}

const manhattanDistance = (a: CoordsData, b: CoordsData): number =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

const createAstarFrontier = (): PathfindingFrontier => {
    let heap: PriorityEntry[] = []

    const swap = (i: number, j: number): void => {
        const tmp = heap[i]!
        heap[i] = heap[j]!
        heap[j] = tmp
    }

    const bubbleUp = (i: number): void => {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2)
            if (heap[parent]!.priority <= heap[i]!.priority) break
            swap(parent, i)
            i = parent
        }
    }

    const sinkDown = (i: number): void => {
        const n = heap.length
        while (true) {
            let smallest = i
            const left = 2 * i + 1
            const right = 2 * i + 2
            if (left < n && heap[left]!.priority < heap[smallest]!.priority) smallest = left
            if (right < n && heap[right]!.priority < heap[smallest]!.priority) smallest = right
            if (smallest === i) break
            swap(i, smallest)
            i = smallest
        }
    }

    return {
        add: (cell, priority = 0) => {
            heap.push({ cell, priority })
            bubbleUp(heap.length - 1)
        },
        get: () => {
            if (!heap.length) return undefined
            const top = heap[0]!.cell
            const last = heap.pop()!
            if (heap.length > 0) {
                heap[0] = last
                sinkDown(0)
            }
            return top
        },
        empty: () => heap.length === 0,
        clean: () => { heap = [] },
    }
}

export const astarAlgorithm: PathfindingAlgorithm = {
    createFrontier: createAstarFrontier,
    enqueueNeighbor: (frontier, neighbor, parent, targetCoords) => {
        const priority = manhattanDistance(neighbor.coords, targetCoords)
        frontier.add(neighbor, priority)
    },
}
