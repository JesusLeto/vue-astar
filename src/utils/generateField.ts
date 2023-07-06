import { CellType, type CellData } from '@/definitions/definitions';
import type { Ref } from 'vue'

export function generateField(xValue: number, yValue: number) {
    const data: CellData[][] = []
    let index = 0
    for(let i = 0; i < xValue; i++) {
        const rowData: CellData[] = [] 
        for(let j = 0; j < yValue; j++) {
            rowData.push({
                coord: {
                    x: j,
                    y: i
                },
                status: CellType.Empty,
                index,
                isVisited: false
            })
            index++
        }
        data.push(rowData)
    }
    return data
}

export function testOut(value: Ref<CellData>) {
    value.value.status = CellType.Barrier
}