<template>
    <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
                <UIcon name="i-lucide-shapes" class="size-4 text-primary" />
                <h2 class="text-sm font-semibold text-highlighted">{{ category.name }}</h2>
            </div>
            <BaseButton size="xs" color="neutral" variant="link" trailing-icon="i-lucide-chevron-right" @click="emit('viewAll')">
                View all
            </BaseButton>
        </div>

        <div v-if="items.length" class="relative -mx-4">
            <div
                ref="scrollEl"
                class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
            >
                <PasabuyItemCard
                    v-for="item in items"
                    :key="item.product.uuid"
                    :product="item.product"
                    :name="item.name"
                    :price="item.price"
                    :confirmed="item.confirmed"
                    :status="item.status"
                    :quantity="item.quantity"
                    class="w-36 shrink-0 snap-start sm:w-40"
                    @select="emit('select', item.product)"
                />
            </div>

            <button
                v-if="canScrollLeft"
                type="button"
                class="absolute left-0 top-1/2 hidden size-9 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-md ring ring-default hover:bg-elevated sm:flex"
                :aria-label="`Scroll ${category.name} left`"
                @click="scrollBy(-1)"
            >
                <UIcon name="i-lucide-chevron-left" class="size-5" />
            </button>
            <button
                v-if="canScrollRight"
                type="button"
                class="absolute right-0 top-1/2 hidden size-9 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-md ring ring-default hover:bg-elevated sm:flex"
                :aria-label="`Scroll ${category.name} right`"
                @click="scrollBy(1)"
            >
                <UIcon name="i-lucide-chevron-right" class="size-5" />
            </button>
        </div>

        <p v-else class="text-sm text-muted">No items in this aisle yet.</p>
    </div>
</template>

<script setup lang="ts">
import type { Category } from '@/types/Category'
import type { Product } from '@/types/Product'

export interface PasabuyShelfItem {
    product: Product
    name: string
    price: string
    confirmed: boolean
    status: 'none' | 'b1t1' | 'out_of_stock'
    quantity: number
}

defineProps<{
    category: Category
    items: PasabuyShelfItem[]
}>()

const emit = defineEmits<{
    select: [product: Product]
    viewAll: []
}>()

const { el: scrollEl, canScrollLeft, canScrollRight, scrollBy, update: updateScroll } = useHorizontalScroll()

defineExpose({ updateScroll })
</script>
