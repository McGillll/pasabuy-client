<template>
    <USelect
        v-model="model"
        :items="items"
        :value-key="valueKey"
        :placeholder="placeholder"
        :size="size"
        :class="class"
        :ui="ui"
    />
</template>

<script setup lang="ts">
import type { SelectItem, SelectProps } from '@nuxt/ui'

withDefaults(defineProps<{
    items: SelectItem[]
    valueKey?: string
    placeholder?: string
    size?: SelectProps['size']
    class?: string
    ui?: SelectProps['ui']
}>(), {
    valueKey: 'value',
    size: 'md',
    class: 'w-full h-11'
})

const model = defineModel<string | number | boolean | undefined>()
</script>
