<template>
    <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
                <UIcon name="i-lucide-shapes" class="size-4 text-primary" />
                <h2 class="text-sm font-semibold text-highlighted">{{ category.name }}</h2>
            </div>
            <BaseButton size="xs" color="neutral" variant="link" trailing-icon="i-lucide-chevron-right" :to="`/customer/products/${category.uuid}`">
                View all
            </BaseButton>
        </div>

        <div v-if="loading" class="flex gap-3 overflow-hidden">
            <div v-for="n in 4" :key="n" class="w-36 shrink-0 space-y-2 sm:w-40">
                <USkeleton class="aspect-square w-full rounded-xl" />
                <USkeleton class="h-4 w-2/3" />
                <USkeleton class="h-4 w-1/3" />
            </div>
        </div>

        <p v-else-if="error" class="text-sm text-muted">Couldn't load this aisle.</p>

        <div v-else-if="products.length" class="relative -mx-4">
            <div
                ref="scrollEl"
                class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
            >
                <ProductShowcaseCard
                    v-for="product in products"
                    :key="product.uuid"
                    :product="product"
                    class="w-36 shrink-0 snap-start sm:w-40"
                    @select="emit('select', $event)"
                />

                <NuxtLink
                    v-if="hasMore"
                    :to="`/customer/products/${category.uuid}`"
                    class="flex aspect-square w-36 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl border border-default bg-elevated/50 text-center text-highlighted transition-colors hover:bg-elevated sm:w-40"
                >
                    <UIcon name="i-lucide-circle-chevron-right" class="size-6 text-primary" />
                    <span class="text-sm font-medium">See more</span>
                </NuxtLink>
            </div>

            <button
                v-if="canScrollLeft"
                type="button"
                class="absolute left-0 top-1/2 hidden size-9 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-sm ring ring-default hover:bg-elevated sm:flex"
                :aria-label="`Scroll ${category.name} left`"
                @click="scrollBy(-1)"
            >
                <UIcon name="i-lucide-chevron-left" class="size-5" />
            </button>
            <button
                v-if="canScrollRight"
                type="button"
                class="absolute right-0 top-1/2 hidden size-9 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-sm ring ring-default hover:bg-elevated sm:flex"
                :aria-label="`Scroll ${category.name} right`"
                @click="scrollBy(1)"
            >
                <UIcon name="i-lucide-chevron-right" class="size-5" />
            </button>
        </div>

        <p v-else class="text-sm text-muted">No products in this aisle yet.</p>
    </div>
</template>

<script setup lang="ts">
import { publicProductService } from '@/components/api/public/PublicProductService'
import type { Category } from '@/types/Category'
import type { Product } from '@/types/Product'

const props = defineProps<{
    category: Category
}>()

const emit = defineEmits<{
    select: [product: Product]
}>()

const products = ref<Product[]>([])
const hasMore = ref(false)
const loading = ref(true)
const error = ref(false)

const { el: scrollEl, canScrollLeft, canScrollRight, scrollBy, update: updateScroll } = useHorizontalScroll()

watch(products, () => nextTick(updateScroll))

onMounted(async () => {
    try {
        const result = await publicProductService.fetchCatalog({ category_uuid: props.category.uuid, per_page: 11 })
        const items = result.data.items as Product[]
        hasMore.value = items.length > 10
        products.value = items.slice(0, 10)
    } catch {
        error.value = true
    } finally {
        loading.value = false
    }
})
</script>
