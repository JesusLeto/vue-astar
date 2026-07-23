import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type BoardTool = 'wall' | 'weight' | 'eraser'

export const useEraserStore = defineStore('eraser:store', () => {
    const activeTool = ref<BoardTool>('wall')

    const isEraserMode = computed(() => activeTool.value === 'eraser')
    const isWeightMode = computed(() => activeTool.value === 'weight')

    function setTool(tool: BoardTool) {
        activeTool.value = tool
    }

    function toggleEraserMode() {
        activeTool.value = isEraserMode.value ? 'wall' : 'eraser'
    }

    function toggleWeightMode() {
        activeTool.value = isWeightMode.value ? 'wall' : 'weight'
    }

    function deactivateEraserMode() {
        if (isEraserMode.value) activeTool.value = 'wall'
    }

    return {
        activeTool,
        isEraserMode,
        isWeightMode,
        setTool,
        toggleEraserMode,
        toggleWeightMode,
        deactivateEraserMode,
    }
})
