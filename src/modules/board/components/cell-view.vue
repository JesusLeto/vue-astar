<script setup lang="ts">
import { computed } from 'vue'

import UiSvg from '@/core/components/ui/ui-svg.vue'
import type { CellData } from '../types'
import {cn} from "@/core/lib/utils.ts";

const props = defineProps<{
    data: CellData
    isExpansion: boolean
    isDragging?: boolean
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
    route: 'animate-route',
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

const isDragCell = computed(() => props.data.type === 'start' || props.data.type === 'target')
</script>

<template>
    <div
        class="flex items-center justify-center w-8 h-8 border border-table relative"
        :class="cn([(isDragCell ? 'cursor-grab' : ''), (isDragCell && isDragging) ? 'cursor-grabbing' : ''])"
    >
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

<style scoped>
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

.animate-bounce-in {
    animation: bounce-in 500ms linear;
}

@keyframes route-in {
  0%   { transform: scale(0.25); }
  100% { transform: scale(1); }
}

.animate-route {
    animation: route-in 200ms linear;
    transform: scale(1.0666);
}

@keyframes expansion-in {
  0%   { background-color: var(--color-cell-expansion-0); border-radius: 100%; transform: scale(0); }
  10%  { border-radius: 50%; }
  60%  { background-color: var(--color-cell-expansion-60); }
  75%  { border-radius: 10%; }
  80%  { background-color: var(--color-cell-expansion-80); }
  100% { background-color: var(--color-cell-expansion-100); border-radius: 0; transform: scale(1); }
}

.animate-expansion {
  animation: expansion-in 1200ms linear;
}
</style>
