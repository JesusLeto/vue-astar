<script setup lang="ts">
import { ref } from 'vue';
import Cell from './Cell.vue';
import { CellType, type CellData, type coords, StartOrTargerType } from '@/definitions/definitions';
import { generateField } from "@/utils"
import Expansion from '@/utils/expansion';

const initValue = generateField(50, 28)

const cellsValue = ref<CellData[][]>(initValue)

const startCell = ref<CellData>(cellsValue.value[10][10])
const preStartCell = ref<CellData>(cellsValue.value[10][10])

const targetCell = ref<CellData>(cellsValue.value[20][40])
const preTargetCell = ref<CellData>(cellsValue.value[20][40])




const isPressMouseButton = ref<boolean>(false)
const isStartCellMove = ref<boolean>(false)
const isTargetCellMove = ref<boolean>(false)

function onMouseAction(data: CellData, isClick = false) {
    if (!isPressMouseButton.value && !isClick) return

    if (isClick && data.startOrTarger === StartOrTargerType.Start) {
        isStartCellMove.value = true
    }
    if (isClick && data.startOrTarger === StartOrTargerType.Target) {
        isTargetCellMove.value = true
    }

    setCellSetting(data)
}

function setCellSetting(data: CellData) {
    if (isStartCellMove.value && data.startOrTarger !== StartOrTargerType.Target) {
        if (data.index !== preStartCell.value.index) {
            const {coord: preStartCoords} = preStartCell.value
            delete cellsValue.value[preStartCoords.y][preStartCoords.x].startOrTarger
            cellsValue.value[data.coord.y][data.coord.x].startOrTarger = StartOrTargerType.Start
            startCell.value = data
            preStartCell.value = data
        }
    } else if (isTargetCellMove.value && data.startOrTarger !== StartOrTargerType.Start) {
        if (data.index !== preTargetCell.value.index) {
            const {coord: preTargetCoords} = preTargetCell.value
            delete cellsValue.value[preTargetCoords.y][preTargetCoords.x].startOrTarger
            cellsValue.value[data.coord.y][data.coord.x].startOrTarger = StartOrTargerType.Target
            targetCell.value = data
            preTargetCell.value = data
        }
    } else {
        cellsValue.value[data.coord.y][data.coord.x].isBarrier = true
    }
}

function onMouseUp() {
    isPressMouseButton.value = false
    isStartCellMove.value = false
    isTargetCellMove.value = false
}



async function start() {
    if (startCell.value.index === undefined) {
    
        return
    }
    if (targetCell.value.index === undefined) {
    
        return
    }
    Expansion.setup(cellsValue.value, startCell.value as CellData)
    await Expansion.start()
}

</script>

<template>
    <div 
        class="board"
        @mousedown="isPressMouseButton = true"
        @mouseup="onMouseUp"
        @dragstart="false"
        @drop="false"
        >
        <template
            v-for="row in cellsValue"
        >
            <Cell
                v-for="data in row"
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
