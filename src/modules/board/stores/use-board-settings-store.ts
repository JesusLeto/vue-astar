import { defineStore } from 'pinia'
import { ref } from 'vue'

export const COLS_MIN = 10
export const COLS_MAX = 80
export const ROWS_MIN = 5
export const ROWS_MAX = 40

export const useBoardSettingsStore = defineStore('board-settings:store', () => {
    const cols = ref(50)
    const rows = ref(28)

    return { cols, rows }
})
