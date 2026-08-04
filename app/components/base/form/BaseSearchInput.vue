<template>
    <UInput
        v-if="!isSmart"
        v-model="model"
        icon="i-lucide-search"
        :placeholder="placeholder"
        :class="class"
        :ui="{ base: 'h-11' }"
    />

    <UInputMenu
        v-else
        v-model:search-term="model"
        :items="items"
        :loading="loading"
        icon="i-lucide-search"
        trailing-icon=""
        :placeholder="placeholder"
        :class="class"
        :ui="{ base: 'h-11' }"
        ignore-filter
        :reset-search-term-on-select="resetSearchTermOnSelect"
        @update:model-value="onSelect"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UInputMenu>
</template>

<script setup lang="ts">
import type { InputMenuItem } from '@nuxt/ui'

const props = withDefaults(defineProps<{
    placeholder?: string
    /**
     * Suggestion items for smart search (e.g. matching customers, orders,
     * schedules, products). Passing this prop at all (even as an empty
     * array) switches this component from a plain debounced text search to
     * a type-ahead combobox; leave it unset for a plain search. This is a
     * static choice per usage, not something that flips at runtime as the
     * item count changes, since fighting the combobox's own open-state
     * logic reactively is what broke type-ahead opening in the first place.
     * Callers own their own ranking/filtering logic per entity type; this
     * component never filters `items` itself.
     */
    items?: InputMenuItem[]
    /** Clears the typed text after a suggestion is picked. */
    resetSearchTermOnSelect?: boolean
    /** Shows a spinner while suggestions are being fetched (smart search only). */
    loading?: boolean
    class?: string
}>(), {
    placeholder: 'Search…',
    resetSearchTermOnSelect: true,
    loading: false,
    class: 'w-full sm:w-72 lg:max-w-md lg:flex-1'
})

const emit = defineEmits<{
    select: [item: InputMenuItem]
}>()

const model = defineModel<string>({ default: '' })

const isSmart = computed(() => props.items !== undefined)

function onSelect(item: InputMenuItem | InputMenuItem[] | undefined) {
    if (!item || Array.isArray(item)) return
    emit('select', item)
}
</script>
