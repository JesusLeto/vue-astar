import { ref } from 'vue'
import { useEventListener, useMousePressed } from '@vueuse/core'
import type { CellData } from '../types'

export const useMouseAction = () => {
    const { pressed: isPressMouseButton } = useMousePressed()
    const isStartCellMove = ref(false)
    const isTargetCellMove = ref(false)

    function onMouseAction(data: CellData, callBack: (params: CellData) => void, isClick = false) {
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
        isStartCellMove.value = false
        isTargetCellMove.value = false
    }

    useEventListener(document, 'mouseleave', onMouseUp)
    useEventListener(document, 'mouseup', onMouseUp)

    return {
        isPressMouseButton,
        isStartCellMove,
        isTargetCellMove,
        onMouseAction,
        onMouseUp,
    }
}
