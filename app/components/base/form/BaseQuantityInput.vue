<template>
    <UInputNumber
        v-model="model"
        :min="min"
        :max="max"
        :size="size"
        :color="color"
        :variant="variant"
        :disabled="disabled"
        :aria-label="ariaLabel"
    />
</template>

<script setup lang="ts">
import type { InputNumberProps } from '@nuxt/ui'

const model = defineModel<number>({ default: 0 })

withDefaults(defineProps<{
    min?: number
    max?: number
    size?: InputNumberProps['size']
    color?: InputNumberProps['color']
    variant?: InputNumberProps['variant']
    disabled?: boolean
    ariaLabel?: string
}>(), {
    min: 0,
    size: 'md',
    color: 'primary',
    variant: 'outline',
    disabled: false,
})
</script>
