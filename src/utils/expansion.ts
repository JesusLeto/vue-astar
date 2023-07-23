import type { Ref } from "vue"
import  {type CellData, CellType, ExpansionType, type GraphTreeData, type GraphRouteData, type coords, StartOrTargerType} from "@/definitions/definitions"
import Queue from "./queue"
import { delay } from "./delay"

function initStartValue(): CellData {
    return {
        isVisited: false,
        isBarrier: false,
        isRoute: false,
        isExpansionProcess: false,
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
            if (currentCell.startOrTarger === StartOrTargerType.Target) {
                await this.buildRoute(this.graphRoutes[currentCell.index])

                //isProcessing.value = false
                return
            }
    
            currentCell.isVisited = true
    
            if (this.startCell.index !== currentCell.index) currentCell.isExpansionProcess = true
    
            await delay(this.delayTime)
    
            this.computeNeighbour(currentCell)
    
            // if (this.startCell.index !== currentCell.index)  {
            //     currentCell.expansionStatus = ExpansionType.Expanded
            // }
           
        }
    }

    computeNeighbour(cell: CellData) {
        const {coord: cellCoords, index} = cell
        const possibleNeighbours: CellData[] = []

        if (cellCoords.x - 1 > -1) {
            possibleNeighbours.push(this.data[cellCoords.y][cellCoords.x - 1])
        }
        if (cellCoords.y + 1 < 28) {
            possibleNeighbours.push(this.data[cellCoords.y + 1][cellCoords.x])
        }
        if (cellCoords.x + 1 < 50) {
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
            if(!nieghbour.isVisited && !nieghbour.isBarrier) {
                nieghbour.isExpansionProcess = true
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
            this.data[rCoords.y][rCoords.x].isRoute = true
            await delay(25)
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