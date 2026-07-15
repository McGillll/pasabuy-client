<template>
    <div class="hidden sm:block">
        <UTable :data="data" :columns="columns" :loading="loading" :ui="ui" v-bind="$attrs">
            <template v-for="(_, name) in cellSlots" #[name]="slotProps">
                <slot :name="name" v-bind="slotProps ?? {}" />
            </template>
        </UTable>
    </div>
    <div class="sm:hidden space-y-2 p-2">
        <template v-if="data.length">
            <slot
                v-for="(item, index) in data"
                :key="itemKey(item, index)"
                name="list-item"
                :item="item"
                :index="index"
            />
        </template>
        <slot v-else name="empty" />
    </div>
</template>

<script setup lang="ts" generic="T">
import { computed, useSlots } from 'vue'
import type { TableColumn } from '@nuxt/ui'

defineProps<{
    data: T[]
    columns: TableColumn<T>[]
    loading?: boolean
    ui?: Record<string, any>
}>()

const slots = useSlots()
const cellSlots = computed(() => Object.fromEntries(Object.entries(slots).filter(([name]) => name !== 'list-item')))

function itemKey(item: T, index: number) {
    return (item as { uuid?: unknown })?.uuid ?? index
}
</script>
