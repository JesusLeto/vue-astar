import type {CellData, CellType} from "@/types"


function getCellType(x: number, y: number ): CellType {
	if (x === 0 && y === 0) return 'start'
	if (x === 40 && y === 20) return 'target'
	return ''
}

export const generateDefaultBoard = () => {
	const data: CellData[][] = []
	let index = 0
	for(let y = 0; y < 28; y++) {
		const rowData: CellData[] = []

		for(let x = 0; x < 50; x++) {
			if (getCellType(x,y)) {
				console.log(index, { x, y }, getCellType(x,y))
			}
			rowData.push({
				coords: { x, y },
				index,
				isVisited: false,
				isExpansionProcess: false,
				type: getCellType(x,y)
			})

			index++
		}

		data.push(rowData)
	}
	return data
}
