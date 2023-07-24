<script setup lang="ts">
import { computed } from "vue"
import {type CellData, StartOrTargerType } from "@/definitions/definitions"
import AImg from "./a-img.vue"

const props = defineProps<{
  data: CellData
}>()


const cellStatusStyle = computed(() => {
	if (props.data.isRoute) return "route"
	if (props.data.isBarrier) return "barier"
	if (props.data.isExpansionProcess) return "expansion"
	return ""
})

const isStartOrtargetCell = computed(() => {
	if (props.data.startOrTarger === StartOrTargerType.Start) return "start"
	if (props.data.startOrTarger === StartOrTargerType.Target) return "target"
	return ""
})


</script>

<template>
  <div 
    class="wrapper"
  >
    <a-img 
      v-if="isStartOrtargetCell"
      :img-name="isStartOrtargetCell"
    />

    <div
      v-else
      class="cell" 
      :class="cellStatusStyle"
    />
  </div>
</template>

<style scoped lang="scss">
.wrapper {
    @include flex-center;
    width: $indent-x4;
    height: $indent-x4;
    border: 1px solid $table-color;

    .cell {
      width: 100%;
      height: 100%;
    }

    .barier {
      background-color: $cell-block;
      animation-name: bounce-in;
      animation-duration: 500ms;
      animation-timing-function: linear;
    }

    .expansion {
      background-color: #41c9e0;
      animation-name: expansion-in;
      animation-duration: 1200ms;
      animation-timing-function: linear;
    }

    .route {
      transform: scale(1.0666);
      background-color: #FDFE6A;
      animation-name: route-in;
      animation-duration: 200ms;
      animation-timing-function: linear;;
    }
}

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

@keyframes expansion-in {
  0%{
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
  100%{
    background-color: #41c9e0;
    border-radius: 0%;
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

