<script setup lang="ts">
import { useExpansionStore } from '@/modules/board'
import { storeToRefs } from 'pinia'
import { Loader2 } from 'lucide-vue-next'
import UiButton from '@/core/components/ui/ui-button.vue'

const expansionStore = useExpansionStore()
const { isExpansionInProcess, isExpansionFinished } = storeToRefs(expansionStore)
</script>

<template>
    <div class="h-20 w-full flex items-center justify-center">
        <ui-button
            v-if="isExpansionFinished"
            size="lg"
            @click="expansionStore.onReset"
        >
            Сбросить
        </ui-button>
        <ui-button
            v-else
            size="lg"
            :variant="isExpansionInProcess ? 'destructive' : 'success'"
            :disabled="isExpansionInProcess"
            @click="expansionStore.onStart"
        >
            <loader2
                v-if="isExpansionInProcess"
                class="h-4 w-4 animate-spin"
            />
            {{ isExpansionInProcess ? 'Построение маршрута' : 'Старт' }}
        </ui-button>
    </div>
</template>
