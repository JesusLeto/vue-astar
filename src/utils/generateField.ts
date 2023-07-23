import { type CellData, StartOrTargerType } from '@/definitions/definitions';

function isStartOrTargerCell(x: number, y: number ) {
    if (x === 10 && y === 10) return StartOrTargerType.Start
    if (x === 40 && y === 20) return StartOrTargerType.Target
    return
}

export function generateField(xValue: number, yValue: number) {
    const data: CellData[][] = []
    let index = 0
    for(let y = 0; y < yValue; y++) {
        const rowData: CellData[] = [] 
        for(let x = 0; x < xValue; x++) {
            rowData.push({
                coord: {
                    x,
                    y
                },
                index,
                isBarrier: false,
                isVisited: false,
                isExpansionProcess: false,
                startOrTarger: isStartOrTargerCell(x,y)
            })
            index++
        }
        data.push(rowData)
    }
    return data
}