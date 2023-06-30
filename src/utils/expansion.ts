import type { Ref } from "vue"
import  {type CellData, CellType, ExpansionType} from "@/definitions/definitions"
import Queue from "./queue"
import { delay } from "./delay"

let END = false

export default async function startExpansion(data: Ref<CellData[][]>, startCell: CellData) {
    const queue = new Queue<CellData>(startCell)


    while (!queue.empty()) {
        const {coord: currentCellCoords} = queue.get() as CellData

        const currentCell = data.value[currentCellCoords.y][currentCellCoords.x]

        if (currentCell.status === CellType.Target) return
        if (currentCell.isVisited) continue

        currentCell.isVisited = true

        if (startCell.index !== currentCell.index) currentCell.expansionStatus = ExpansionType.Processed

        await delay(5)

        if (currentCellCoords.x - 1 > -1) {
            const possibleNeighbour = data.value[currentCellCoords.y][currentCellCoords.x - 1]
            checkPossibleNeighbour(possibleNeighbour, queue)
        }
        if (currentCellCoords.y + 1 < 40) {
            const possibleNeighbour = data.value[currentCellCoords.y + 1][currentCellCoords.x]
            checkPossibleNeighbour(possibleNeighbour, queue)
        }
        if (currentCellCoords.x + 1 < 40) {
            const possibleNeighbour = data.value[currentCellCoords.y][currentCellCoords.x + 1]
            checkPossibleNeighbour(possibleNeighbour, queue)
        }
        if (currentCellCoords.y - 1 > -1) {
            const possibleNeighbour = data.value[currentCellCoords.y - 1][currentCellCoords.x]
            checkPossibleNeighbour(possibleNeighbour, queue)
        }

        if (END) return

        if (startCell.index !== currentCell.index)  {
            currentCell.expansionStatus = ExpansionType.Expanded
        }
       
    }
}

function checkPossibleNeighbour(nieghbour: CellData, queue: Queue<CellData>) {
    if (nieghbour.status === CellType.Target) {
        END = true
        return
    }
    if(!nieghbour.isVisited && nieghbour.status !== CellType.Barrier) {
        nieghbour.expansionStatus = ExpansionType.Processed
        queue.add(nieghbour)
    }
}