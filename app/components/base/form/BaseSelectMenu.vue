<template>
    <USelectMenu
        v-model="model"
        :items="items"
        :value-key="valueKey"
        :placeholder="placeholder"
        :loading="loading"
        :size="size"
        :class="class"
        :ui="ui"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </USelectMenu>
</template>

<script setup lang="ts">
import type { SelectMenuItem, SelectMenuProps } from '@nuxt/ui'

withDefaults(defineProps<{
    items: SelectMenuItem[]
    valueKey?: string
    placeholder?: string
    loading?: boolean
    size?: SelectMenuProps['size']
    class?: string
    ui?: SelectMenuProps['ui']
}>(), {
    valueKey: 'value',
    size: 'md',
    class: 'w-full'
})

const model = defineModel<any>()
</script>
