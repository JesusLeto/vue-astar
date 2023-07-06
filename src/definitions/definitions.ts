export enum CellType {
    Start = "Start",
    Target = "Target",
    Barrier = "Barrier",
    Empty = "Empty",
    Route = "Route"
}

export enum ExpansionType {
    Expanded = "Expanded",
    Processed = "Processed"
}

export type coords = {
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
    status?: CellType
    expansionStatus?: ExpansionType
    isVisited: Boolean
}

export interface GraphRouteData {
    value: coords,
    preRouteStepData?: GraphRouteData
}

export interface GraphTreeData {
    [key: number]: GraphRouteData
}