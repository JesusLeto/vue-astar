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

export type Coords = {
    x: number,
    y: number
}

export interface SearchData {
    start: Coords
    target: Coords
    barrier: Coords[]
}

export interface CellData {
    coord: Coords
    index: number

    startOrTarget: StartOrTargerType | null
    //status?: CellType

    isBarrier: boolean
    isExpansionProcess: boolean
    isVisited: boolean
    isRoute?: boolean
}

export interface GraphRouteData {
    value: Coords,
    preRouteStepData?: GraphRouteData
}

export interface GraphTreeData {
    [key: number]: GraphRouteData
}
