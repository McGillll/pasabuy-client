<template>
    <USwitch
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
    </USwitch>
</template>

<script setup lang="ts">
import type { SwitchProps } from '@nuxt/ui'

withDefaults(defineProps<{
    label?: string
    size?: SwitchProps['size']
    disabled?: boolean
    color?: SwitchProps['color']
    class?: string
}>(), {
    size: 'md',
    disabled: false
})

const model = defineModel<boolean>()
</script>
