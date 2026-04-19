<script setup lang="ts">
import { computed } from 'vue'

import UiSvg from '@/core/components/ui/ui-svg.vue'
import type { CellData } from '../types'

const props = defineProps<{
    data: CellData
    isExpansion: boolean
}>()

const cellStatusStyle = computed(() => {
    if (props.data.type) return props.data.type
    if (props.data.isExpansionProcess) return 'expansion'
    return ''
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
            :class="[cellStatusStyle, isExpansion ? 'with-animation' : '']"
        />
    </div>
</template>

<style scoped>
.barrier {
    position: absolute;
    top: -1px;
    left: -1px;
    z-index: 100;
    width: calc(100% + 2px);
    height: calc(100% + 2px);
    background-color: #00154f;
}

.barrier.with-animation {
    animation: bounce-in 500ms linear;
}

.expansion {
    background-color: #41c9e0;
}

.expansion.with-animation {
    animation-name: expansion-in;
    animation-duration: 1200ms;
    animation-timing-function: linear;
}

.route {
    background-color: #fdfe6a;
}

.route.with-animation {
    transform: scale(1.0666);
    animation-name: route-in;
    animation-duration: 200ms;
    animation-timing-function: linear;
}

@keyframes expansion-in {
    0% {
        background-color: #414974;
        border-radius: 100%;
        transform: scale(0);
    }
    10% {
        border-radius: 50%;
    }
    60% {
        background-color: #4884d6;
    }
    75% {
        border-radius: 10%;
    }
    80% {
        background-color: #42ddcb;
    }
    100% {
        background-color: #41c9e0;
        border-radius: 0;
        transform: scale(1);
    }
}

@keyframes route-in {
    0% {
        transform: scale(0.25);
    }
    100% {
        transform: scale(1);
    }
}
</style>
