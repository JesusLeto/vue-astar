<script setup lang="ts">
import {useExpansion} from "@/services/expansion.service"
import {storeToRefs} from "pinia"

const expansionService = useExpansion()
const { isExpansionInProcess, isExpansionFinished } = storeToRefs(expansionService)
</script>

<template>
  <div class="the-header" >
    <ui-button
        v-if="isExpansionFinished"
        label="Сбросить"
        size="large"
        @click="expansionService.onReset"
    />
    <ui-button
        v-else
        :label="isExpansionInProcess ? 'Построение маршрута' : 'Старт'"
        size="large"
        :loading="isExpansionInProcess"
        :severity="isExpansionInProcess ? 'danger' : 'success'"
        @click="expansionService.onStart"
    />
  </div>
</template>

<style scoped lang="scss">
.the-header {
  height: 80px;
  width: 100%;
  @include flex-center
}
</style>
