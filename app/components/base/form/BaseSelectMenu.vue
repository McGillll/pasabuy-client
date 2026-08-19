<template>
    <USelectMenu
        v-model="model"
        v-model:search-term="searchTerm"
        :items="items"
        :value-key="valueKey"
        :placeholder="placeholder"
        :loading="loading"
        :size="size"
        :ignore-filter="ignoreFilter"
        :content="content"
        :class="class"
        :ui="mergedUi"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </USelectMenu>
</template>

<script setup lang="ts">
import type { SelectMenuItem, SelectMenuProps } from '@nuxt/ui'

const props = withDefaults(defineProps<{
    items: SelectMenuItem[]
    valueKey?: string
    placeholder?: string
    loading?: boolean
    size?: SelectMenuProps['size']
    /** Skips the built-in label-matching filter, for when `items` is already server-filtered. */
    ignoreFilter?: boolean
    content?: SelectMenuProps['content']
    class?: string
    ui?: SelectMenuProps['ui']
}>(), {
    valueKey: 'value',
    size: 'md',
    ignoreFilter: false,
    class: 'w-full'
})

const model = defineModel<any>()
const searchTerm = defineModel<string>('searchTerm', { default: '' })

const mergedUi = computed(() => ({ base: 'h-11', ...(props.ui ?? {}) }))
</script>
