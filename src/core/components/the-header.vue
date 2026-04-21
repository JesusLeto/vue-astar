<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useExpansionStore, useEraserStore, useBoardSettingsStore, COLS_MIN, COLS_MAX, ROWS_MIN, ROWS_MAX } from '@/modules/board'
import { bfsAlgorithm, astarAlgorithm } from '@/modules/board'
import { storeToRefs } from 'pinia'
import { Loader2 } from 'lucide-vue-next'
import UiButton from '@/core/components/ui/ui-button.vue'
import UiSelect from '@/core/components/ui/ui-select.vue'
import type { SelectOption } from '@/core/components/ui/ui-select.vue'
import type { PathfindingAlgorithm } from '@/modules/board'
import { SUPPORTED_LOCALES, type Locale } from '@/core/i18n'

const { t, locale } = useI18n()
const router = useRouter()

const expansionStore = useExpansionStore()
const { isExpansionInProcess, isExpansionFinished } = storeToRefs(expansionStore)

const eraserStore = useEraserStore()
const { isEraserMode } = storeToRefs(eraserStore)

const settingsStore = useBoardSettingsStore()

const colsInput = ref(settingsStore.cols)
const rowsInput = ref(settingsStore.rows)

const algorithmMap: Record<string, PathfindingAlgorithm> = {
    bfs: bfsAlgorithm,
    astar: astarAlgorithm,
}

const algorithmOptions = [
    { value: 'bfs', label: 'BFS' },
    { value: 'astar', label: 'A*' },
] as const satisfies readonly SelectOption[]

const selectedAlgorithm = ref<string>('bfs')

const localeOptions = SUPPORTED_LOCALES.map(l => ({ value: l, label: l.toUpperCase() })) satisfies SelectOption[]

const selectedLocale = computed<Locale>({
    get: () => locale.value as Locale,
    set: (value) => router.push(`/${value}`),
})

watch(selectedAlgorithm, (value) => {
    const algorithm = algorithmMap[value]
    if (algorithm) {
        expansionStore.setAlgorithm(algorithm)
    }
})

watch(isExpansionInProcess, (inProcess) => {
    if (inProcess) eraserStore.deactivateEraserMode()
})

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function applyGridSize() {
    const newCols = clamp(colsInput.value, COLS_MIN, COLS_MAX)
    const newRows = clamp(rowsInput.value, ROWS_MIN, ROWS_MAX)
    colsInput.value = newCols
    rowsInput.value = newRows
    if (newCols === settingsStore.cols && newRows === settingsStore.rows) return
    settingsStore.cols = newCols
    settingsStore.rows = newRows
    eraserStore.deactivateEraserMode()
    expansionStore.onReset()
}

function handleReset() {
    eraserStore.deactivateEraserMode()
    expansionStore.onReset()
}

function handleStart() {
    eraserStore.deactivateEraserMode()
    expansionStore.onStart()
}
</script>

<template>
    <div class="h-20 w-full flex items-center justify-center gap-4">
        <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
            {{ t('columns') }}
            <input
                v-model.number="colsInput"
                type="number"
                :min="COLS_MIN"
                :max="COLS_MAX"
                :disabled="isExpansionInProcess"
                class="w-16 h-10 rounded-md border border-slate-200 bg-white px-2 text-sm text-center ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                @change="applyGridSize"
            />
        </label>
        <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
            {{ t('rows') }}
            <input
                v-model.number="rowsInput"
                type="number"
                :min="ROWS_MIN"
                :max="ROWS_MAX"
                :disabled="isExpansionInProcess"
                class="w-16 h-10 rounded-md border border-slate-200 bg-white px-2 text-sm text-center ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                @change="applyGridSize"
            />
        </label>
        <ui-select
            v-model="selectedAlgorithm"
            :options="algorithmOptions"
        />
        <ui-button
            size="lg"
            :disabled="isExpansionInProcess"
            @click="handleReset"
        >
            {{ t('reset') }}
        </ui-button>
        <ui-button
            v-if="!isExpansionFinished"
            size="lg"
            :variant="isEraserMode ? 'default' : 'outline'"
            :disabled="isExpansionInProcess"
            @click="eraserStore.toggleEraserMode"
        >
            {{ t('eraser') }}
        </ui-button>
        <ui-button
            v-if="!isExpansionFinished"
            size="lg"
            :variant="isExpansionInProcess ? 'destructive' : 'success'"
            :disabled="isExpansionInProcess"
            @click="handleStart"
        >
            <loader2
                v-if="isExpansionInProcess"
                class="h-4 w-4 animate-spin"
            />
            {{ isExpansionInProcess ? t('buildingRoute') : t('start') }}
        </ui-button>
        <ui-select
            v-model="selectedLocale"
            :options="localeOptions"
        />
    </div>
</template>
