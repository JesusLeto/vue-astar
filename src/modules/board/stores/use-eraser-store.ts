import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEraserStore = defineStore('eraser:store', () => {
    const isEraserMode = ref(false)

    function toggleEraserMode() {
        isEraserMode.value = !isEraserMode.value
    }

    function deactivateEraserMode() {
        isEraserMode.value = false
    }

    return { isEraserMode, toggleEraserMode, deactivateEraserMode }
})
