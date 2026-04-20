import { ref } from 'vue'

const isEraserMode = ref(false)

export const useEraserMode = () => {
    function toggleEraserMode() {
        isEraserMode.value = !isEraserMode.value
    }

    function deactivateEraserMode() {
        isEraserMode.value = false
    }

    return {
        isEraserMode,
        toggleEraserMode,
        deactivateEraserMode,
    }
}
