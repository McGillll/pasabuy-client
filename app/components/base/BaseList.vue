<template>
    <div class="space-y-2">
        <template v-if="loading">
            <USkeleton v-for="n in skeletonCount" :key="n" class="h-16 w-full rounded-xl" />
        </template>

        <BaseEmptyState
            v-else-if="items.length === 0"
            :icon="emptyIcon"
            :message="emptyMessage"
            :description="emptyDescription"
        />

        <template v-else>
            <slot
                v-for="(item, index) in items"
                :key="itemKey(item, index)"
                name="item"
                :item="item"
                :index="index"
            />
        </template>
    </div>
</template>

<script setup lang="ts" generic="T">
withDefaults(defineProps<{
    items: T[]
    loading?: boolean
    skeletonCount?: number
    emptyIcon?: string
    emptyMessage?: string
    emptyDescription?: string
}>(), {
    loading: false,
    skeletonCount: 3,
    emptyIcon: 'i-lucide-inbox',
    emptyMessage: 'Nothing here yet.'
})

function itemKey(item: T, index: number) {
    return (item as { uuid?: unknown })?.uuid ?? index
}
</script>
