<template>
    <div>
        <div ref="containerRef" class="flex flex-nowrap items-center gap-2 overflow-hidden">
            <button
                v-for="item in visibleItems"
                :key="item.value"
                type="button"
                class="min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors"
                :class="item.value === modelValue ? 'bg-primary text-inverted' : 'bg-elevated text-muted hover:text-highlighted'"
                @click="select(item.value)"
            >
                {{ item.label }}
            </button>

            <button
                v-if="overflowItems.length"
                type="button"
                class="min-h-11 shrink-0 whitespace-nowrap rounded-full bg-elevated px-4 text-sm font-medium text-primary"
                @click="isSheetOpen = true"
            >
                More ({{ overflowItems.length }})
            </button>
        </div>

        <div ref="measureRef" aria-hidden="true" class="pointer-events-none absolute left-0 top-0 h-0 overflow-hidden opacity-0" style="visibility: hidden; z-index: -1;">
            <button
                v-for="item in items"
                :key="item.value"
                type="button"
                class="min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium"
            >
                {{ item.label }}
            </button>
            <button type="button" class="min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium">
                More ({{ items.length }})
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
    title?: string
    searchPlaceholder?: string
}>(), {
    title: 'All options',
    searchPlaceholder: 'Search…'
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const isSheetOpen = ref(false)
const sheetSearch = ref('')

const containerRef = ref<HTMLElement | null>(null)
const measureRef = ref<HTMLElement | null>(null)
const visibleCount = ref(0)

const GAP = 8
// Generous on purpose: it's far better to show one fewer chip than to clip
// the "More" chip against the container's overflow-hidden edge.
const SAFETY_MARGIN = 32
// Covers sub-pixel width differences between the hidden measurement clone
// and the real rendered row (font hinting, rounding); without it, a chip
// that "fits" by a fraction of a pixel in JS can still clip in the DOM.
const ROUNDING_BUFFER = 4

function recalculate() {
    const container = containerRef.value
    const measure = measureRef.value
    if (!container || !measure) return

    const containerWidth = container.getBoundingClientRect().width - SAFETY_MARGIN
    const children = Array.from(measure.children) as HTMLElement[]
    const itemEls = children.slice(0, props.items.length)
    const moreEl = children[children.length - 1]
    if (!moreEl) return

    const moreWidth = Math.ceil(moreEl.getBoundingClientRect().width)

    let usedWidth = 0
    let count = 0

    for (let i = 0; i < itemEls.length; i++) {
        const itemWidth = Math.ceil(itemEls[i]!.getBoundingClientRect().width)
        const isLast = i === itemEls.length - 1
        const widthWithThisItem = usedWidth + (count > 0 ? GAP : 0) + itemWidth
        const reserveForMore = isLast ? 0 : GAP + moreWidth
        const fits = widthWithThisItem + reserveForMore <= containerWidth

        if (fits || (isLast && widthWithThisItem + ROUNDING_BUFFER <= containerWidth)) {
            usedWidth = widthWithThisItem
            count++
        } else {
            break
        }
    }

    visibleCount.value = count
}

const visibleItems = computed(() => props.items.slice(0, visibleCount.value))
const overflowItems = computed(() => props.items.slice(visibleCount.value))

const filteredItems = computed(() => {
    const query = sheetSearch.value.trim().toLowerCase()
    if (!query) return props.items
    return props.items.filter((item) => item.label.toLowerCase().includes(query))
})

function select(value: string) {
    emit('update:modelValue', value)
    isSheetOpen.value = false
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
    await nextTick()
    recalculate()
    resizeObserver = new ResizeObserver(() => recalculate())
    if (containerRef.value) resizeObserver.observe(containerRef.value)

    document.fonts?.ready.then(() => recalculate())
})

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
})

watch(() => props.items, async () => {
    await nextTick()
    recalculate()
})
</script>
