import type { CellData, CellType, CoordsData } from '../types'

function getCellType(x: number, y: number, startCoords: CoordsData, targetCoords: CoordsData): CellType {
    if (x === startCoords.x && y === startCoords.y) return 'start'
    if (x === targetCoords.x && y === targetCoords.y) return 'target'
    return ''
}

export const generateDefaultBoard = (
    cols: number,
    rows: number,
    startCoords: CoordsData,
    targetCoords: CoordsData,
) => {
    const data: CellData[][] = []
    for (let y = 0; y < rows; y++) {
        const rowData: CellData[] = []
        for (let x = 0; x < cols; x++) {
            rowData.push({
                coords: { x, y },
                index: y * cols + x,
                isVisited: false,
                isExpansionProcess: false,
                type: getCellType(x, y, startCoords, targetCoords),
            })
        }
        data.push(rowData)
    }
    return data
}

export const getDefaultCoords = (cols: number, rows: number) => {
    const startCoords: CoordsData = { x: 0, y: 0 }
    const targetCoords: CoordsData = {
        x: Math.max(1, Math.min(cols - 2, 40)),
        y: Math.max(1, Math.min(rows - 2, 20)),
    }
    return { startCoords, targetCoords }
}
