<script setup lang="ts">

import { CellType } from '@/definitions';


const props = defineProps({
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

function handleCheck(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

</script>

<template>
  <div class="radio-group">
    <div>
        <input type="radio" id="start" :value="CellType.Start" name="cellType" @change="handleCheck"/>
        <label for="start">Start</label>
    </div>
      
    <div>
        <input type="radio" id="target" :value="CellType.Target" name="cellType" @change="handleCheck"/>
        <label for="target">Target</label>
    </div>
    
    <div>
        <input type="radio" id="barrier" :value="CellType.Barrier" name="cellType" @change="handleCheck"/>
        <label for="barrier">Barrier</label>
    </div>
  </div>
</template>

<style scoped>
.radio-group {
    padding-top: 10px;
    display: flex;
    justify-content: center;
}

.radio-group div {
    margin: 0 10px;
}

</style>
