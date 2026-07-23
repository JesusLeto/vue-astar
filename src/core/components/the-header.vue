<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
    useExpansionStore,
    useEraserStore,
    useBoardSettingsStore,
    useBoardStore,
    COLS_MIN,
    COLS_MAX,
    ROWS_MIN,
    ROWS_MAX,
    pathfindingAlgorithms,
} from '@/modules/board'
import { storeToRefs } from 'pinia'
import { Bomb, BrickWall, Eraser, Loader2, Play, RotateCcw, Route, Trash2, Weight } from 'lucide-vue-next'
import UiButton from '@/core/components/ui/ui-button.vue'
import UiSelect from '@/core/components/ui/ui-select.vue'
import type { SelectOption } from '@/core/components/ui/ui-select.vue'
import type { MazePattern, PathfindingAlgorithm, PathfindingAlgorithmId } from '@/modules/board'
import type { VisualizationSpeed } from '@/modules/board/stores/use-expansion-store'
import type { BoardTool } from '@/modules/board/stores/use-eraser-store'
import { SUPPORTED_LOCALES, type Locale } from '@/core/i18n'

const { t, locale } = useI18n()
const router = useRouter()

const boardStore = useBoardStore()
const { bombCellCoords } = storeToRefs(boardStore)

const expansionStore = useExpansionStore()
const { isExpansionInProcess, isExpansionFinished, currentAlgorithm, speed } = storeToRefs(expansionStore)

const eraserStore = useEraserStore()
const { activeTool } = storeToRefs(eraserStore)

const settingsStore = useBoardSettingsStore()

const colsInput = ref(settingsStore.cols)
const rowsInput = ref(settingsStore.rows)
const selectedAlgorithm = ref<PathfindingAlgorithmId>('bfs')
const selectedPattern = ref<MazePattern>('randomWalls')
const selectedSpeed = ref<VisualizationSpeed>(speed.value)

const algorithmMap = pathfindingAlgorithms.reduce(
    (acc, algorithm) => {
        acc[algorithm.id] = algorithm
        return acc
    },
    {} as Record<PathfindingAlgorithmId, PathfindingAlgorithm>
)

const algorithmOptions = pathfindingAlgorithms.map(algorithm => ({
    value: algorithm.id,
    label: algorithm.label,
})) satisfies SelectOption[]

const patternOptions = computed<readonly SelectOption[]>(() => [
    { value: 'randomWalls', label: t('randomWalls') },
    { value: 'recursiveDivision', label: t('recursiveDivision') },
    { value: 'verticalDivision', label: t('verticalDivision') },
    { value: 'horizontalDivision', label: t('horizontalDivision') },
    { value: 'randomWeights', label: t('randomWeights') },
    { value: 'stair', label: t('stairPattern') },
])

const speedOptions = computed<readonly SelectOption[]>(() => [
    { value: 'fast', label: t('fast') },
    { value: 'average', label: t('average') },
    { value: 'slow', label: t('slow') },
])

const localeOptions = SUPPORTED_LOCALES.map(l => ({ value: l, label: l.toUpperCase() })) satisfies SelectOption[]

const selectedLocale = computed<Locale>({
    get: () => locale.value as Locale,
    set: value => router.push(`/${value}`),
})

const algorithmDescriptor = computed(() => {
    const algorithm = currentAlgorithm.value
    const weightText = algorithm.weighted ? t('weighted') : t('unweighted')
    const guaranteeText = algorithm.guaranteesShortestPath
        ? t('guaranteesShortestPath')
        : t('doesNotGuaranteeShortestPath')
    return `${algorithm.label}: ${weightText}, ${guaranteeText}`
})

watch(selectedAlgorithm, value => {
    const algorithm = algorithmMap[value]
    expansionStore.setAlgorithm(algorithm)
    if (!algorithm.weighted && activeTool.value === 'weight') eraserStore.setTool('wall')
})

watch(selectedSpeed, value => {
    expansionStore.setSpeed(value)
})

watch(isExpansionInProcess, inProcess => {
    if (inProcess) eraserStore.setTool('wall')
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
    eraserStore.setTool('wall')
    expansionStore.onReset()
}

function handleReset() {
    eraserStore.setTool('wall')
    expansionStore.onReset()
}

function handleClearPath() {
    expansionStore.clearPath()
}

function handleClearWalls() {
    eraserStore.setTool('wall')
    expansionStore.clearPath()
    boardStore.clearWallsAndWeights()
}

function handlePattern() {
    eraserStore.setTool('wall')
    expansionStore.clearPath()
    boardStore.applyMazePattern(selectedPattern.value)
}

function handleBomb() {
    if (!currentAlgorithm.value.supportsBomb) return
    eraserStore.setTool('wall')
    expansionStore.clearPath()
    boardStore.toggleBomb()
}

function handleTool(tool: BoardTool) {
    eraserStore.setTool(tool)
}

function handleStart() {
    eraserStore.setTool('wall')
    void expansionStore.onStart()
}
</script>

<template>
    <header class="w-full border-b border-slate-200 bg-white px-4 py-3">
        <div class="flex flex-wrap items-center justify-center gap-2">
            <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
                {{ t('columns') }}
                <input
                    v-model.number="colsInput"
                    type="number"
                    :min="COLS_MIN"
                    :max="COLS_MAX"
                    :disabled="isExpansionInProcess"
                    class="h-10 w-16 rounded-md border border-slate-200 bg-white px-2 text-center text-sm ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
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
                    class="h-10 w-16 rounded-md border border-slate-200 bg-white px-2 text-center text-sm ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    @change="applyGridSize"
                />
            </label>
            <ui-select
                v-model="selectedAlgorithm"
                :options="algorithmOptions"
                :disabled="isExpansionInProcess"
            />
            <ui-select
                v-model="selectedSpeed"
                :options="speedOptions"
                :disabled="isExpansionInProcess"
            />
            <ui-select
                v-model="selectedPattern"
                :options="patternOptions"
                :disabled="isExpansionInProcess"
            />
            <ui-button
                variant="secondary"
                :disabled="isExpansionInProcess"
                @click="handlePattern"
            >
                <brick-wall class="h-4 w-4" />
                {{ t('generate') }}
            </ui-button>
            <ui-button
                :variant="activeTool === 'wall' ? 'default' : 'outline'"
                :disabled="isExpansionInProcess"
                @click="handleTool('wall')"
            >
                <brick-wall class="h-4 w-4" />
                {{ t('wall') }}
            </ui-button>
            <ui-button
                :variant="activeTool === 'weight' ? 'default' : 'outline'"
                :disabled="isExpansionInProcess || !currentAlgorithm.weighted"
                @click="handleTool('weight')"
            >
                <weight class="h-4 w-4" />
                {{ t('weight') }}
            </ui-button>
            <ui-button
                :variant="activeTool === 'eraser' ? 'default' : 'outline'"
                :disabled="isExpansionInProcess"
                @click="handleTool('eraser')"
            >
                <eraser class="h-4 w-4" />
                {{ t('eraser') }}
            </ui-button>
            <ui-button
                :variant="bombCellCoords ? 'destructive' : 'outline'"
                :disabled="isExpansionInProcess || !currentAlgorithm.supportsBomb"
                @click="handleBomb"
            >
                <bomb class="h-4 w-4" />
                {{ bombCellCoords ? t('removeBomb') : t('addBomb') }}
            </ui-button>
            <ui-button
                variant="outline"
                :disabled="isExpansionInProcess"
                @click="handleClearPath"
            >
                <route class="h-4 w-4" />
                {{ t('clearPath') }}
            </ui-button>
            <ui-button
                variant="outline"
                :disabled="isExpansionInProcess"
                @click="handleClearWalls"
            >
                <trash2 class="h-4 w-4" />
                {{ t('clearWalls') }}
            </ui-button>
            <ui-button
                variant="outline"
                :disabled="isExpansionInProcess"
                @click="handleReset"
            >
                <rotate-ccw class="h-4 w-4" />
                {{ t('reset') }}
            </ui-button>
            <ui-button
                v-if="!isExpansionFinished"
                :variant="isExpansionInProcess ? 'destructive' : 'success'"
                :disabled="isExpansionInProcess"
                @click="handleStart"
            >
                <loader2
                    v-if="isExpansionInProcess"
                    class="h-4 w-4 animate-spin"
                />
                <play
                    v-else
                    class="h-4 w-4"
                />
                {{ isExpansionInProcess ? t('buildingRoute') : t('start') }}
            </ui-button>
            <ui-select
                v-model="selectedLocale"
                :options="localeOptions"
            />
        </div>
        <p class="mt-2 text-center text-xs font-medium text-slate-600">
            {{ algorithmDescriptor }}
        </p>
    </header>
</template>
