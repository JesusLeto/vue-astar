<script setup lang="ts">
import { ref, watch } from 'vue'
import { useExpansionStore, useEraserStore } from '@/modules/board'
import { bfsAlgorithm } from '@/modules/board'
import { storeToRefs } from 'pinia'
import { Loader2 } from 'lucide-vue-next'
import UiButton from '@/core/components/ui/ui-button.vue'
import UiSelect from '@/core/components/ui/ui-select.vue'
import type { SelectOption } from '@/core/components/ui/ui-select.vue'
import type { PathfindingAlgorithm } from '@/modules/board'

const expansionStore = useExpansionStore()
const { isExpansionInProcess, isExpansionFinished } = storeToRefs(expansionStore)

const eraserStore = useEraserStore()
const { isEraserMode } = storeToRefs(eraserStore)

const algorithmMap: Record<string, PathfindingAlgorithm> = {
    bfs: bfsAlgorithm,
}

const algorithmOptions = [{ value: 'bfs', label: 'BFS' }] as const satisfies readonly SelectOption[]

const selectedAlgorithm = ref<string>('bfs')

watch(selectedAlgorithm, (value) => {
    const algorithm = algorithmMap[value]
    if (algorithm) {
        expansionStore.setAlgorithm(algorithm)
    }
})

watch(isExpansionInProcess, (inProcess) => {
    if (inProcess) eraserStore.deactivateEraserMode()
})

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
        <ui-select
            v-model="selectedAlgorithm"
            :options="algorithmOptions"
        />
        <ui-button
            size="lg"
            :disabled="isExpansionInProcess"
            @click="handleReset"
        >
            Сбросить
        </ui-button>
        <ui-button
            v-if="!isExpansionFinished"
            size="lg"
            :variant="isEraserMode ? 'default' : 'outline'"
            :disabled="isExpansionInProcess"
            @click="eraserStore.toggleEraserMode"
        >
            Ластик
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
            {{ isExpansionInProcess ? 'Построение маршрута' : 'Старт' }}
        </ui-button>
    </div>
</template>
