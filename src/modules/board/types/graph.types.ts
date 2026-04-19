import type { CoordsData } from './cell.types'

export interface GraphRouteData {
    value: CoordsData
    preRouteStepData?: GraphRouteData
}

export interface GraphTreeData {
    [key: number]: GraphRouteData
}
