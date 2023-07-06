import type { Ref } from "vue"
import  {type CellData, CellType, ExpansionType, type GraphTreeData, type GraphRouteData, type coords} from "@/definitions/definitions"
import Queue from "./queue"
import { delay } from "./delay"

// const Route: Partial<GraphRoutesData> = {}

// export default async function startExpansion(data: Ref<CellData[][]>, startCell: CellData, isProcessing: Ref<boolean>) {
//     isProcessing.value = true 
//     const queue = new Queue<CellData>(startCell)

//     Route[startCell.index] = {
//         value: startCell.coord,
//     }

//     while (!queue.empty()) {
//         const {coord: currentCellCoords, index: currentCellIndex} = queue.get() as CellData

//         const currentCell = data.value[currentCellCoords.y][currentCellCoords.x]

//         if (currentCell.isVisited) continue

//         if (currentCell.status === CellType.Target) {
//             const routeAsGraph = Route[currentCell.index]
//             if (routeAsGraph) await buildRoute(routeAsGraph, data)
//             isProcessing.value = false
//             return
//         }

//         currentCell.isVisited = true

//         if (startCell.index !== currentCell.index) currentCell.expansionStatus = ExpansionType.Processed

//         await delay(1)

//         computeNeighbour(currentCell, data, queue)

//         if (startCell.index !== currentCell.index)  {
//             currentCell.expansionStatus = ExpansionType.Expanded
//         }
       
//     }
// }

// function computeNeighbour(cellData: CellData, data: Ref<CellData[][]>, queue: Queue<CellData>) {
//     const {coord: cellCoords, index} = cellData

//     if (cellCoords.x - 1 > -1) {
//         const possibleNeighbour = data.value[cellCoords.y][cellCoords.x - 1]
//         checkPossibleNeighbour(possibleNeighbour, queue, index)
//     }
//     if (cellCoords.y + 1 < 40) {
//         const possibleNeighbour = data.value[cellCoords.y + 1][cellCoords.x]
//         checkPossibleNeighbour(possibleNeighbour, queue, index)
//     }
//     if (cellCoords.x + 1 < 40) {
//         const possibleNeighbour = data.value[cellCoords.y][cellCoords.x + 1]
//         checkPossibleNeighbour(possibleNeighbour, queue, index)
//     }
//     if (cellCoords.y - 1 > -1) {
//         const possibleNeighbour = data.value[cellCoords.y - 1][cellCoords.x]
//         checkPossibleNeighbour(possibleNeighbour, queue, index)
//     }
// }

// function checkPossibleNeighbour(nieghbour: CellData, queue: Queue<CellData>, parentIndex: number) {
//     if(!nieghbour.isVisited && nieghbour.status !== CellType.Barrier) {
//         nieghbour.expansionStatus = ExpansionType.Processed
//         queue.add(nieghbour)

//         const parentData  = Route[parentIndex]
//         if (parentData) {
//             Route[nieghbour.index] = {
//                 value: nieghbour.coord,
//                 preRouteStepData: parentData
//             }
//         }
//     }
// }

// async function buildRoute(graph: RouteStepData, data:  Ref<CellData[][]>) {
//     const routeCoords: coords[] = []
//     while(graph.preRouteStepData) {
//         routeCoords.push(graph.value)
//         graph = graph.preRouteStepData
//     }

//     for (let rCoords of routeCoords.reverse()) {
//         data.value[rCoords.y][rCoords.x].status = CellType.Route
//         await delay(5)
//     }
// }

function initStartValue(): CellData {
    return {
        isVisited: false,
        coord: {x: 0, y: 0},
        index: 0
    }

}


class Expansion {

    private data:  CellData[][] = []
    private graphRoutes: GraphTreeData = {}

    private startCell: CellData = initStartValue()

    private delayTime: number = 1
    private isStopped = false

    setup(data: CellData[][], startCell: CellData) {
        this.data = data
        this.startCell = startCell

        Queue.add(this.startCell)
        this.graphRoutes = {[startCell.index]: {value: startCell.coord}}
    }

    async start () {
        this.isStopped = false
        while (!Queue.empty() && !this.isStopped) {
            //while (this.isStopped) {}
            const {coord: currentCellCoords} = Queue.get() as CellData
    
            const currentCell = this.data[currentCellCoords.y][currentCellCoords.x]
    
            if (currentCell.isVisited) continue
            if (currentCell.status === CellType.Target) {
                await this.buildRoute(this.graphRoutes[currentCell.index])
                //isProcessing.value = false
                return
            }
    
            currentCell.isVisited = true
    
            if (this.startCell.index !== currentCell.index) currentCell.expansionStatus = ExpansionType.Processed
    
            await delay(this.delayTime)
    
            this.computeNeighbour(currentCell)
    
            if (this.startCell.index !== currentCell.index)  {
                currentCell.expansionStatus = ExpansionType.Expanded
            }
           
        }
    }

    computeNeighbour(cell: CellData) {
        const {coord: cellCoords, index} = cell
        const possibleNeighbours: CellData[] = []

        if (cellCoords.x - 1 > -1) {
            possibleNeighbours.push(this.data[cellCoords.y][cellCoords.x - 1])
        }
        if (cellCoords.y + 1 < 40) {
            possibleNeighbours.push(this.data[cellCoords.y + 1][cellCoords.x])
        }
        if (cellCoords.x + 1 < 40) {
            possibleNeighbours.push(this.data[cellCoords.y][cellCoords.x + 1])
        }
        if (cellCoords.y - 1 > -1) {
            possibleNeighbours.push(this.data[cellCoords.y - 1][cellCoords.x])
        }
        if (!possibleNeighbours.length) return

        this.checkPossibleNeighbour(possibleNeighbours, index)
    }

    checkPossibleNeighbour(nieghboursData: CellData[], parentIndex: number) {
        nieghboursData.forEach(nieghbour => {
            if(!nieghbour.isVisited && nieghbour.status !== CellType.Barrier) {
                nieghbour.expansionStatus = ExpansionType.Processed
                Queue.add(nieghbour)

                this.graphRoutes[nieghbour.index] = {
                    value: nieghbour.coord,
                    preRouteStepData: this.graphRoutes[parentIndex]
                }
            }
        })
    }


    async buildRoute(targetGraph: GraphRouteData | undefined) {
        if (!targetGraph) return
        const routeCoords: coords[] = []
        while(targetGraph.preRouteStepData) {
            routeCoords.push(targetGraph.value)
            targetGraph = targetGraph.preRouteStepData
        }
    
        for (const rCoords of routeCoords.reverse()) {
            this.data[rCoords.y][rCoords.x].status = CellType.Route
            await delay(5)
        }
    }

    stop() {
        this.isStopped = true
    }

    setDelayTime(time: number) {
        this.delayTime = time
    }
}

export default new Expansion()