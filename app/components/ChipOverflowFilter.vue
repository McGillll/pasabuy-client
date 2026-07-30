<template>
    <div>
        <div class="flex flex-wrap gap-2">
            <button
                v-for="item in visibleItems"
                :key="item.value"
                type="button"
                class="min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition-colors"
                :class="item.value === modelValue ? 'bg-primary text-inverted' : 'bg-elevated text-muted hover:text-highlighted'"
                @click="select(item.value)"
            >
                {{ item.label }}
            </button>

            <button
                v-if="overflowItems.length"
                type="button"
                class="min-h-11 shrink-0 rounded-full bg-elevated px-4 text-sm font-medium text-primary"
                @click="isSheetOpen = true"
            >
                More ({{ overflowItems.length }})
            </button>
        </div>

        <USlideover v-model:open="isSheetOpen" side="bottom" :title="title">
            <template #body>
                <div class="space-y-3">
                    <BaseSearchInput v-model="sheetSearch" :placeholder="searchPlaceholder" class="w-full" />
                    <div class="grid grid-cols-2 gap-2">
                        <button
                            v-for="item in filteredItems"
                            :key="item.value"
                            type="button"
                            class="min-h-11 rounded-lg px-3 text-left text-sm font-medium ring-1 ring-default transition-colors"
                            :class="item.value === modelValue ? 'bg-primary/10 text-primary ring-primary' : 'text-muted hover:text-highlighted'"
                            @click="select(item.value)"
                        >
                            {{ item.label }}
                        </button>
                    </div>
                    <BaseEmptyState v-if="filteredItems.length === 0" icon="i-lucide-search-x" message="No matches." padding="py-6" />
                </div>
            </template>
        </USlideover>
    </div>
</template>

<script setup lang="ts">
interface ChipOverflowItem {
    label: string
    value: string
}

const props = withDefaults(defineProps<{
    items: ChipOverflowItem[]
    modelValue: string
    visibleCount?: number
    title?: string
    searchPlaceholder?: string
}>(), {
    visibleCount: 6,
    title: 'All options',
    searchPlaceholder: 'Search…'
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const isSheetOpen = ref(false)
const sheetSearch = ref('')

const visibleItems = computed(() => props.items.slice(0, props.visibleCount))
const overflowItems = computed(() => props.items.slice(props.visibleCount))

const filteredItems = computed(() => {
    const query = sheetSearch.value.trim().toLowerCase()
    if (!query) return props.items
    return props.items.filter((item) => item.label.toLowerCase().includes(query))
})

function select(value: string) {
    emit('update:modelValue', value)
    isSheetOpen.value = false
}
</script>
