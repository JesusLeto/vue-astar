<script setup lang="ts">
import { ref } from "vue"
import CellView from "./cell-view.vue"
import { type CellData, StartOrTargerType } from "@/definitions/definitions"
import {useExpansion} from "@/utils/expansion"
import {useBoardStore} from "@/store/useBoardStore"
import {storeToRefs} from "pinia"

const boardStore = useBoardStore()
const { boardCellsState } = storeToRefs(boardStore)



const isPressMouseButton = ref<boolean>(false)
const isStartCellMove = ref<boolean>(false)
const isTargetCellMove = ref<boolean>(false)

function onMouseAction(data: CellData, isClick = false) {
	if (!isPressMouseButton.value && !isClick) return

	if (isClick && data.startOrTarget === StartOrTargerType.Start) {
		isStartCellMove.value = true
	}
	if (isClick && data.startOrTarget === StartOrTargerType.Target) {
		isTargetCellMove.value = true
	}

	setCellSetting(data)
}

function setCellSetting(data: CellData) {
	if (isStartCellMove.value && data.startOrTarget !== StartOrTargerType.Target) {
		boardStore.setCellSetting(data, StartOrTargerType.Start)
	} else if (isTargetCellMove.value && data.startOrTarget !== StartOrTargerType.Start) {
		boardStore.setCellSetting(data, StartOrTargerType.Target)
	} else {
		boardStore.setCellSetting(data)
	}
}

function onMouseUp() {
	isPressMouseButton.value = false
	isStartCellMove.value = false
	isTargetCellMove.value = false
}

const { onStart } = useExpansion()
function start() {
	onStart()
}

</script>

<template>
  <button @click="start()" >start</button>
    <div
        class="board"
        @mousedown="isPressMouseButton = true"
        @mouseup="onMouseUp"
        @dragstart="false"
        @drop="false"
        >
        <template
            v-for="row in boardCellsState"
        >
            <cell-view
                v-for="(data, index) in row"
                :key="index"
                :data="data"
                @mousedown="() => onMouseAction(data, true)"
                @mousemove="() => onMouseAction(data)"
            />
        </template>
    </div>
</template>

<style scoped lang="scss">
.board {
    margin-top: 24px;


    width: 1602px;
    height: 898px;
    display: flex;
    flex-wrap: wrap;

    border: 1px solid $table-color;
}

.testCell {
    width: 32px;
    height: 32px;
    background-color: $cell-block;
    border: 1px solid $table-color;
}
</style>
