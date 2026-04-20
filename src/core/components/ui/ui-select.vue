<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '@/core/lib/utils.ts'

export interface SelectOption {
    value: string
    label: string
}

interface Props {
    options: readonly SelectOption[]
}

defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })
const props = defineProps<Props>()

const selectVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer bg-slate-100 text-slate-900 hover:bg-slate-100/80 h-10 px-4 py-2'
)
</script>

<template>
    <select
        :value="model"
        :class="cn(selectVariants(), ($attrs.class as string) ?? '')"
        @change="(e: Event) => (model = (e.target as HTMLSelectElement)?.value ?? '')"
    >
        <option
            v-for="option in props.options"
            :key="option.value"
            :value="option.value"
        >
            {{ option.label }}
        </option>
    </select>
</template>
