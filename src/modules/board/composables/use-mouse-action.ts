import { ref } from 'vue'
import { useEventListener, useMousePressed } from '@vueuse/core'
import type { CellData, CellSpecialType } from '../types'

export const useMouseAction = () => {
    const { pressed: isPressMouseButton } = useMousePressed()
    const isStartCellMove = ref(false)
    const isTargetCellMove = ref(false)
    const isBombCellMove = ref(false)
    const isWeightKeyPressed = ref(false)

    function onMouseAction(data: CellData, callBack: (params: CellData) => void, isClick = false) {
        if (!isPressMouseButton.value && !isClick) return

        if (isClick && data.type === 'start') {
            isStartCellMove.value = true
        }
        if (isClick && data.type === 'target') {
            isTargetCellMove.value = true
        }
        if (isClick && data.type === 'bomb') {
            isBombCellMove.value = true
        }

        callBack(data)
    }

    function getMovedCellType(): CellSpecialType | null {
        if (isStartCellMove.value) return 'start'
        if (isTargetCellMove.value) return 'target'
        if (isBombCellMove.value) return 'bomb'
        return null
    }

    function onMouseUp() {
        isStartCellMove.value = false
        isTargetCellMove.value = false
        isBombCellMove.value = false
    }

    useEventListener(document, 'keydown', (event: KeyboardEvent) => {
        if (event.key.toLowerCase() === 'w') isWeightKeyPressed.value = true
    })
    useEventListener(document, 'keyup', (event: KeyboardEvent) => {
        if (event.key.toLowerCase() === 'w') isWeightKeyPressed.value = false
    })
    useEventListener(document, 'mouseleave', onMouseUp)
    useEventListener(document, 'mouseup', onMouseUp)

    return {
        isPressMouseButton,
        isStartCellMove,
        isTargetCellMove,
        isBombCellMove,
        isWeightKeyPressed,
        getMovedCellType,
        onMouseAction,
        onMouseUp,
    }
}
