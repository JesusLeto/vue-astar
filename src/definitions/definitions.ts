export enum CellType {
    Start = "Start",
    Target = "Target",
    Barrier = "Barrier",
    Empty = "Empty",
    Route = "Route"
}

export enum StartOrTargerType {
    Start = "Start",
    Target = "Target",
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

    startOrTarger?: StartOrTargerType
    //status?: CellType
    isBarrier: Boolean
    isExpansionProcess: Boolean
    isVisited: Boolean
    isRoute: Boolean
}

export interface GraphRouteData {
    value: coords,
    preRouteStepData?: GraphRouteData
}

export interface GraphTreeData {
    [key: number]: GraphRouteData
}