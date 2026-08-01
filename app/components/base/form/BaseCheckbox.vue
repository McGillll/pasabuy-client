<template>
    <UCheckbox
        v-model="model"
        :label="label"
        :size="size"
        :disabled="disabled"
        :color="color"
        :class="class"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UCheckbox>
</template>

<script setup lang="ts">
import type { CheckboxProps } from '@nuxt/ui'

withDefaults(defineProps<{
    label?: string
    size?: CheckboxProps['size']
    disabled?: boolean
    color?: CheckboxProps['color']
    class?: string
}>(), {
    size: 'md',
    disabled: false
})

const model = defineModel<boolean | 'indeterminate'>({ required: true })
</script>
