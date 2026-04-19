<script setup lang="ts">
import { computed } from 'vue'

import UiSvg from '@/core/components/ui/ui-svg.vue'
import type { CellData } from '../types'

const props = defineProps<{
    data: CellData
    isExpansion: boolean
}>()

type CellVisualType = 'barrier' | 'expansion' | 'route'

const BASE_CLASSES: Record<CellVisualType, string> = {
    barrier: 'absolute z-100 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-cell-barrier',
    expansion: 'bg-cell-expansion-100',
    route: 'bg-cell-route',
}

const ANIMATION_CLASSES: Partial<Record<CellVisualType, string>> = {
    barrier: 'animate-bounce-in',
    expansion: 'animate-expansion',
    route: 'animate-route scale-[1.0666]',
}

const cellStatusStyle = computed(() => {
    const type: CellVisualType | null =
        props.data.type === 'barrier' || props.data.type === 'route' ? props.data.type
        : props.data.isExpansionProcess ? 'expansion'
        : null

    if (!type) return ''

    const base = BASE_CLASSES[type]
    const animation = props.isExpansion ? (ANIMATION_CLASSES[type] ?? '') : ''
    return animation ? `${base} ${animation}` : base
})
</script>

<template>
    <div class="flex items-center justify-center w-8 h-8 border border-table relative">
        <ui-svg
            v-if="data.type === 'start' || data.type === 'target'"
            :name="data.type"
            draggable="false"
        />

        <div
            v-else
            class="cell w-full h-full"
            :class="cellStatusStyle"
        />
    </div>
</template>
