import type { Ref } from "vue"
import  {type CellData, CellType} from "@/definitions/definitions"
import Queue from "./queue"

const delay = (time: number) => new Promise((res) => setTimeout(res, time))

export default async function startExpansion(data: Ref<CellData[][]>, startCell: CellData) {
    const queue = new Queue<CellData>(startCell)

    while (!queue.empty()) {
        const {coord: currentCellCoords} = queue.get()
        const isStartCell = startCell.index === data.value[currentCellCoords.y][currentCellCoords.x].index
        if (data.value[currentCellCoords.y][currentCellCoords.x].isVisited) continue
        if (data.value[currentCellCoords.y][currentCellCoords.x].status === CellType.Barrier) continue
        if (data.value[currentCellCoords.y][currentCellCoords.x].status === CellType.Target) return
        if (!isStartCell) {
            data.value[currentCellCoords.y][currentCellCoords.x].isVisited = true
        }
        await delay(5)


        if (currentCellCoords.x - 1 > -1) {
            const possibleNeighbour = data.value[currentCellCoords.y][currentCellCoords.x - 1]
            queue.add(possibleNeighbour)
        }
        if (currentCellCoords.x + 1 < 40) {
            const possibleNeighbour = data.value[currentCellCoords.y][currentCellCoords.x + 1]
            queue.add(possibleNeighbour)
        }
        if (currentCellCoords.y - 1 > -1) {
            const possibleNeighbour = data.value[currentCellCoords.y - 1][currentCellCoords.x]
            queue.add(possibleNeighbour)
        }
        if (currentCellCoords.y + 1 < 40) {
            const possibleNeighbour = data.value[currentCellCoords.y + 1][currentCellCoords.x]
            queue.add(possibleNeighbour)
        }
       
    }

    // const interval = setInterval(() => {
    //     if (queue.empty()) {
    //         clearInterval(interval)
    //         return
    //     }
    //     const {coord: currentCellCoords} = queue.get()
    //     if ( data.value[currentCellCoords.y][currentCellCoords.x].isVisited) return

    //     data.value[currentCellCoords.y][currentCellCoords.x].isVisited = true
        
    //     if (currentCellCoords.x - 1 > -1) {
    //         const possibleNeighbour = data.value[currentCellCoords.y][currentCellCoords.x - 1]
    //         queue.add(possibleNeighbour)
    //     }
    //     if (currentCellCoords.x + 1 < 40) {
    //         const possibleNeighbour = data.value[currentCellCoords.y][currentCellCoords.x + 1]
    //         queue.add(possibleNeighbour)
    //     }
    //     if (currentCellCoords.y - 1 > -1) {
    //         const possibleNeighbour = data.value[currentCellCoords.y - 1][currentCellCoords.x]
    //         queue.add(possibleNeighbour)
    //     }
    //     if (currentCellCoords.x + 1 < 40) {
    //         const possibleNeighbour = data.value[currentCellCoords.y + 1][currentCellCoords.x]
    //         queue.add(possibleNeighbour)
    //     }
    // }, 100)
}