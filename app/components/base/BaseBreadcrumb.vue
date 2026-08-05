<template>
    <UBreadcrumb
        :items="items"
        color="neutral"
        :ui="mergedUi"
        class="overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        :class="props.class"
    >
        <template #item-label="{ item }">
            <span class="truncate" @click="onLabelClick($event, item as BaseBreadcrumbItem)">
                {{ item.label }}
            </span>
        </template>
    </UBreadcrumb>
</template>

<script setup lang="ts">
import type { BreadcrumbItem, BreadcrumbProps } from '@nuxt/ui'

export interface BaseBreadcrumbItem extends BreadcrumbItem {
    onBack?: () => void
}

const props = defineProps<{
    items: BaseBreadcrumbItem[]
    class?: string
}>()

const mergedUi: BreadcrumbProps['ui'] = {
    list: 'flex-nowrap',
    item: 'max-w-40 shrink-0',
    link: 'min-h-11'
}

function onLabelClick(event: MouseEvent, item: BaseBreadcrumbItem) {
    if (!item.onBack) return
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    item.onBack()
}
</script>
