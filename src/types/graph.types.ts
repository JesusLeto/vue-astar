import type {CoordsData} from "@/types/cell.types"

export interface GraphRouteData {
	value: CoordsData,
	preRouteStepData?: GraphRouteData
}

export interface GraphTreeData {
	[key: number]: GraphRouteData
}
