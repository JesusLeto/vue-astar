export type CellType = 'start' | 'target' | 'barrier' | 'route' | ''

export interface CoordsData {
	x: number
	y: number
}

export interface CellData {
	index: number
	coords: CoordsData
	type: CellType

	isVisited: boolean
	isExpansionProcess: boolean
}
