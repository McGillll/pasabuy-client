<template>
    <button
        type="button"
        class="group relative overflow-hidden rounded-xl ring ring-default shadow-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="wide ? 'aspect-[21/6] sm:aspect-[21/5]' : 'aspect-square'"
        @click="emit('select', category)"
    >
        <template v-if="category.image_url">
            <img
                :src="category.image_url"
                loading="lazy"
                alt=""
                class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
            <p class="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-xs font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                {{ category.name }}
            </p>
        </template>

        <template v-else>
            <div
                class="absolute inset-0 flex bg-elevated transition-colors group-hover:bg-elevated/70"
                :class="wide ? 'flex-row items-center gap-3 px-4' : 'flex-col items-center justify-center gap-2 p-3 text-center'"
            >
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-default text-muted ring-1 ring-default">
                    <UIcon :name="icon" class="size-5" />
                </div>
                <p class="line-clamp-2 text-xs font-semibold text-highlighted">{{ category.name }}</p>
            </div>
        </template>

        <UIcon
            v-if="category.has_children"
            name="i-lucide-chevron-right"
            class="absolute right-2 top-2 size-3.5 rounded-full p-1"
            :class="category.image_url ? 'bg-black/40 text-white' : 'bg-default/70 text-dimmed ring-1 ring-default'"
        />
    </button>
</template>

<script setup lang="ts">
import type { Category } from '@/types/Category'

const props = defineProps<{
    category: Category
    /** Full-width row layout, used for an odd remainder tile in a 2-column grid. */
    wide?: boolean
}>()

const emit = defineEmits<{
    select: [category: Category]
}>()

const ICON_KEYWORDS: [RegExp, string][] = [
    [/baby|kids|toy/i, 'i-lucide-baby'],
    [/grocer/i, 'i-lucide-carrot'],
    [/health|personal care|beauty/i, 'i-lucide-heart-pulse'],
    [/house(hold)? equip|appliance|electronic/i, 'i-lucide-house'],
    [/clean|essential|hygiene/i, 'i-lucide-spray-can'],
    [/pet/i, 'i-lucide-paw-print'],
    [/snack|beverage|drink/i, 'i-lucide-cup-soda'],
    [/frozen/i, 'i-lucide-snowflake'],
    [/stationery|school|office/i, 'i-lucide-pencil']
]

const icon = computed(() => {
    const match = ICON_KEYWORDS.find(([pattern]) => pattern.test(props.category.name))
    return match ? match[1] : 'i-lucide-shapes'
})
</script>
