<script lang="ts" setup>
import { computed, type Component } from 'vue'
import StartIcon from '@/assets/icon/start.svg?component'
import TargetIcon from '@/assets/icon/target.svg?component'

const props = withDefaults(
    defineProps<{
        name?: string
        size?: 'big' | 'medium' | 'small' | 'xsmall' | ''
    }>(),
    {
        name: '',
        size: 'big',
    }
)

const icons: Record<string, Component> = {
    start: StartIcon,
    target: TargetIcon,
}

const sizeClass = computed(() => {
    const map: Record<string, string> = {
        big: 'w-8 h-8',
        medium: 'w-5 h-5',
        small: 'w-4 h-4',
        xsmall: 'w-3 h-3',
    }
    return map[props.size] ?? 'w-8 h-8'
})

const icon = computed(() => icons[props.name] ?? null)
</script>

<template>
    <component
        v-if="icon"
        :is="icon"
        :class="sizeClass"
        aria-hidden="true"
    />
</template>
