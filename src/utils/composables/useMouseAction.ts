import {onMounted, ref} from "vue"
import type {CellData} from "@/types"

export const useMouseAction = () => {

	const isPressMouseButton = ref(false)
	const isStartCellMove = ref(false)
	const isTargetCellMove = ref(false)

	function onMouseAction(data: CellData, callBack: (params: CellData) => void,  isClick = false) {
		if (!isPressMouseButton.value && !isClick) return

		if (isClick && data.type === 'start') {
			isStartCellMove.value = true
		}
		if (isClick && data.type === 'target') {
			isTargetCellMove.value = true
		}

		callBack(data)
	}

	function onMouseUp() {
		isPressMouseButton.value = false
		isStartCellMove.value = false
		isTargetCellMove.value = false
	}

	onMounted(() => {
		document.addEventListener('mouseleave', () => {
			onMouseUp()
		})
	})

	return {
		isPressMouseButton,
		isStartCellMove,
		isTargetCellMove,
		onMouseAction,
		onMouseUp
	}
}
