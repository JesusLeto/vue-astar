import type { CellData, CellType } from '../types'
import { BOARD_COLS, BOARD_ROWS, START_CELL_COORDS, TARGET_CELL_COORDS } from '../constants'

function getCellType(x: number, y: number): CellType {
    if (x === START_CELL_COORDS.x && y === START_CELL_COORDS.y) return 'start'
    if (x === TARGET_CELL_COORDS.x && y === TARGET_CELL_COORDS.y) return 'target'
    return ''
}

export const generateDefaultBoard = () => {
    const data: CellData[][] = []
    let index = 0
    for (let y = 0; y < BOARD_ROWS; y++) {
        const rowData: CellData[] = []

        for (let x = 0; x < BOARD_COLS; x++) {
            rowData.push({
                coords: { x, y },
                index,
                isVisited: false,
                isExpansionProcess: false,
                type: getCellType(x, y),
            })

            index++
        }

        data.push(rowData)
    }
    return data
}
