export type CellSpecialType = 'start' | 'target' | 'bomb'
export type CellType = CellSpecialType | 'barrier' | 'route' | ''

export interface CoordsData {
    x: number
    y: number
}

export interface CellData {
    index: number
    coords: CoordsData
    type: CellType
    weight: number

    isVisited: boolean
    isExpansionProcess: boolean
}
