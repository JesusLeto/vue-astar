<script setup lang="ts">
import { computed } from "vue"

import UiSvg from "@/components/shared/UiSvg.vue"
import type {CellData} from "@/types"

const props = defineProps<{
  data: CellData,
  isExpansion: boolean
}>()


const cellStatusStyle = computed(() => {
	if (props.data.type) return props.data.type
	if (props.data.isExpansionProcess) return "expansion"
	return ""
})


</script>

<template>
  <div class="wrapper">
    <ui-svg
        v-if="data.type === 'start' ||  data.type === 'target'"
        :name="data.type"
        draggable="false"
    />

    <div
      v-else
      class="cell"
      :class="[cellStatusStyle, isExpansion ? 'with-animation' : '']"
    />
  </div>
</template>

<style scoped lang="scss">
.wrapper {
    @include flex-center;
    width: $indent-x4;
    height: $indent-x4;
    border: 1px solid $table-color;

    position: relative;

    .cell {
      width: 100%;
      height: 100%;
    }

    .barrier {
      position: absolute;
      top: -1px;
      left: -1px;
      z-index: 100;
      width: calc(100% + 2px);
      height: calc(100% + 2px);
      background-color: $cell-barrier;

      &.with-animation {
       @include bounce-in
      }
    }

    .expansion {
      background-color: $cell-expansion-100;

      &.with-animation {
        animation-name: expansion-in;
        animation-duration: 1200ms;
        animation-timing-function: linear;
      }
    }

    .route {
      background-color: $cell-route;

      &.with-animation {
        transform: scale(1.0666);
        animation-name: route-in;
        animation-duration: 200ms;
        animation-timing-function: linear;
      }
    }
}

@keyframes expansion-in {
  0%{
    background-color: $cell-expansion-0;
    border-radius: 100%;
    transform: scale(0);
  }

  10% {
    border-radius: 50%;
  }

  60% {
    background-color: $cell-expansion-60;
  }
  75% {
    border-radius: 10%;
  }
  80% {
    background-color: $cell-expansion-80;
  }

  100%{
    background-color: $cell-expansion-100;
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

