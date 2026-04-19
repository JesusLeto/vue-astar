<script setup lang="ts">
import { BoardView } from '@/modules/board'
import TheHeader from '@/core/components/the-header.vue'
</script>

<template>
    <div class="w-full h-screen">
        <the-header />
        <board-view />
    </div>
</template>
