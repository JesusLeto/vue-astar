<script setup lang="ts">
import { ref } from 'vue';
import Cell from './Cell.vue';
import { CellType, type CellData, type coords } from '@/definitions/definitions';
import { generateField } from "@/utils"
import Expansion from '@/utils/expansion';

const props = defineProps<{
    currentCellType: CellType
}>()

const initValue = generateField(40, 40)

const cellsValue = ref<CellData[][]>(initValue)
const startCell = ref<Partial<CellData>>({})
const targetCell = ref<Partial<CellData>>({})
const isProcessing = ref<boolean>(false)

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
    cellsValue.value[data.coord.y][data.coord.x].status = props.currentCellType
}

function setStartCell(data: CellData) {
    if (startCell.value.index === data.index) return
    
    if (startCell.value.coord !== undefined) {
        cellsValue.value[startCell.value.coord.y][startCell.value.coord.x].status = CellType.Empty
    }

    if (cellsValue.value[data.coord.y][data.coord.x].status === CellType.Target) targetCell.value = {}
    startCell.value = data
}

function setTargetCell(data: CellData) {
    if (targetCell.value.index === data.index) return
    
    if (targetCell.value.coord !== undefined) {
        cellsValue.value[targetCell.value.coord.y][targetCell.value.coord.x].status = CellType.Empty
    }

    if (cellsValue.value[data.coord.y][data.coord.x].status === CellType.Start) startCell.value = {}
    targetCell.value = data
}

function setBarrierCell(data: CellData) {
    if (cellsValue.value[data.coord.y][data.coord.x].status === CellType.Start) startCell.value = {}
    if (cellsValue.value[data.coord.y][data.coord.x].status === CellType.Target) targetCell.value = {}
}

async function start() {
    if (startCell.value.index === undefined) {
        showAlert("Set start")
        return
    }
    if (targetCell.value.index === undefined) {
        showAlert("Set target")
        return
    }
    Expansion.setup(cellsValue.value, startCell.value as CellData)
    await Expansion.start()
}

function clear() {
    startCell.value = {}
    targetCell.value = {}

    cellsValue.value.forEach(row => {
        row.forEach(cell => {
            cell.status = CellType.Empty
            cell.isVisited = false
            cell.expansionStatus = undefined
        })
    })
}

function showAlert(text: string) {
    alert(text)
}

function setDelayTime(e: Event) {
    Expansion.setDelayTime(Number((e.target as HTMLInputElement).value))
}

</script>

<template>
    <div>
        <div class="tools">
            <button @click="start" :disabled="isProcessing">Start</button>
            <button @click="clear" :disabled="isProcessing">Clear</button>
            <button @click="Expansion.start">Resume</button>
            <button @click="Expansion.stop">Stop</button>
            <input type="range" min="0" max="100" step="1" value="50" @input="(e) => setDelayTime(e)"/>
        </div>
        
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
    position: relative;
    left: 50%;
    transform: translate(-50%);
    width: 843px;
    height: 843px;
    border: 1px solid black;
    display: flex;
    flex-wrap: wrap;
    padding-top: 1px;
    padding-left: 1px;
}

.tools {
    display:flex;
    width: 250px;
    justify-content: space-between;
}
</style>
