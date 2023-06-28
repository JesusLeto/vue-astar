export enum CellType {
    Start = "Start",
    Target = "Target",
    Barrier = "Barrier",
    Empty = "Empty"
}

type coords = {
    x: number,
    y: number
}

export interface SearchData {
    start: coords
    target: coords
    barrier: coords[]
}

export interface CellData {
    coord: coords
    index: number
    status: CellType | undefined
    isVisited: Boolean
}