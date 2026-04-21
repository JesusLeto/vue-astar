<script setup lang="ts">
import { BoardView } from '@/modules/board'
import TheHeader from '@/core/components/the-header.vue'
</script>

<template>
    <div class="w-full h-screen flex flex-col">
        <the-header />
        <div class="flex-1 overflow-auto flex items-start justify-center pb-4">
            <board-view />
        </div>
    </div>
</template>
