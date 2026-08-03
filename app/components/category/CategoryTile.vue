<template>
    <button
        type="button"
        class="relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-default bg-default p-3 text-center shadow-sm transition-colors hover:bg-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        @click="emit('select', category)"
    >
        <UIcon
            v-if="category.has_children"
            name="i-lucide-chevron-right"
            class="absolute right-2 top-2 size-3.5 text-dimmed"
        />
        <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UIcon name="i-lucide-shapes" class="size-5" />
        </div>
        <p class="line-clamp-2 text-xs font-semibold text-highlighted">{{ category.name }}</p>
    </button>
</template>

<script setup lang="ts">
import type { Category } from '@/types/Category'

defineProps<{
    category: Category
}>()

const emit = defineEmits<{
    select: [category: Category]
}>()
</script>
