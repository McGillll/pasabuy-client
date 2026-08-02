<template>
    <div class="sticky top-0 z-10 -mx-6 space-y-2 border-b border-default bg-default px-6 py-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]">
        <div class="flex items-center gap-2">
            <div class="min-w-0 flex-1">
                <BaseSearchInput v-model="search" :placeholder="placeholder" class="w-full" />
            </div>
            <slot name="inline" />
            <BaseButton
                v-if="showFilterButton"
                class="sm:hidden shrink-0"
                color="neutral"
                variant="outline"
                icon="i-lucide-list-filter"
                @click="emit('filter-click')"
            >
                Filters
                <UBadge v-if="filterCount" color="primary" variant="subtle" size="sm">{{ filterCount }}</UBadge>
            </BaseButton>
        </div>

        <slot />
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    placeholder?: string
    showFilterButton?: boolean
    filterCount?: number
}>(), {
    placeholder: 'Search…',
    showFilterButton: false,
    filterCount: 0
})

const emit = defineEmits<{
    'filter-click': []
}>()

const search = defineModel<string>({ default: '' })
</script>
