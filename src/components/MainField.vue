<script setup lang="ts">
import { ref } from 'vue';
import Cell from './Cell.vue';
import { CellType, type CellData } from '@/definitions/definitions';
import { generateField } from "@/utils"

const props = defineProps<{
    currentCellType: CellType
}>()

const initValue = generateField(10, 10)

const cellsValue = ref<CellData[][]>(initValue)
const startCell = ref<Partial<CellData>>({})
const targetCell = ref<Partial<CellData>>({})

const isPressMouseButton = ref<boolean>(false)

function setCellSetting(data: CellData, force = false) {
    if (!isPressMouseButton.value && !force) return

    if (props.currentCellType === CellType.Start) {
        setStartCell(data)
    }
    if (props.currentCellType === CellType.Target) {
        setTargetCell(data)
    }
    if (props.currentCellType === CellType.Barrier) {
        setBarrierCell(data)
    }
    cellsValue.value[data.coord.x][data.coord.y].status = props.currentCellType
}

function setStartCell(data: CellData) {
    if (startCell.value.index === data.index) return
    
    if (startCell.value.coord !== undefined) {
        cellsValue.value[startCell.value.coord.x][startCell.value.coord.y].status = CellType.Empty
    }

    if (cellsValue.value[data.coord.x][data.coord.y].status === CellType.Target) targetCell.value = {}
    startCell.value = data
}

function setTargetCell(data: CellData) {
    if (targetCell.value.index === data.index) return
    
    if (targetCell.value.coord !== undefined) {
        cellsValue.value[targetCell.value.coord.x][targetCell.value.coord.y].status = CellType.Empty
    }

    if (cellsValue.value[data.coord.x][data.coord.y].status === CellType.Start) startCell.value = {}
    targetCell.value = data
}

function setBarrierCell(data: CellData) {
    if (cellsValue.value[data.coord.x][data.coord.y].status === CellType.Start) startCell.value = {}
    if (cellsValue.value[data.coord.x][data.coord.y].status === CellType.Target) targetCell.value = {}
}

</script>

<template>
    <div>
        <div 
            class="field"
            @mousedown="() => isPressMouseButton = true"
            @mouseup="() => isPressMouseButton = false"
        >
        <template
            v-for="row in cellsValue"
        >
            <Cell
            v-for="data in row"
            :data="data"
            @click="() => setCellSetting(data, true)"
            @mousemove="() => setCellSetting(data)"
        />
    </template>
  </div>
    </div>
</template>

<style scoped>
.field {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 846px;
    height: 846px;
    border: 1px solid black;
    display: flex;
    flex-wrap: wrap;
    padding-top: 4px;
    padding-left: 4px;
}
</style>
