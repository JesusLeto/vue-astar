import { type CellData, StartOrTargerType } from "@/definitions/definitions"

function isStartOrTargetCell(x: number, y: number ) {
	if (x === 0 && y === 0) return StartOrTargerType.Start
	if (x === 40 && y === 20) return StartOrTargerType.Target
	return null
}

export const generateDefaultBoard = () => {
	const data: CellData[][] = []
	let index = 0
	for(let y = 0; y < 28; y++) {
		const rowData: CellData[] = []

		for(let x = 0; x < 50; x++) {
			if (isStartOrTargetCell(x,y)) {
				console.log(index, { x, y }, isStartOrTargetCell(x,y))
			}
			rowData.push({
				coord: { x, y },
				index,
				isBarrier: false,
				isVisited: false,
				isExpansionProcess: false,
				startOrTarget: isStartOrTargetCell(x,y)
			})

			index++
		}

		data.push(rowData)
	}
	return data
}
