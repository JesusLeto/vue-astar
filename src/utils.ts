import { CellType, type CellData } from "./definitions"

export function generateField(xValue: number, yValue: number) {
    const data: CellData[] = []
    let index = 0
    for(let i = 0; i < xValue; i++) {
        for(let j = 0; j < yValue; j++) {
            data.push({
                coord: {
                    x: i,
                    y: j
                },
                status: CellType.Empty,
                index
            })
            index++
        }
    }
    return data
}