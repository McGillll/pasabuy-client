<template>
    <div class="space-y-3">
        <div v-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div v-for="n in 8" :key="n" class="space-y-2 rounded-xl border border-default p-3">
                <USkeleton class="aspect-square w-full rounded-lg" />
                <USkeleton class="h-4 w-2/3" />
                <USkeleton class="h-4 w-1/3" />
            </div>
        </div>

        <UAlert
            v-else-if="error"
            color="error"
            variant="subtle"
            title="Failed to load products"
            :description="error"
        >
            <template #actions>
                <BaseButton size="xs" color="error" variant="soft" @click="emit('retry')">
                    Retry
                </BaseButton>
            </template>
        </UAlert>

        <template v-else>
            <div v-if="visibleProducts.length === 0" class="flex flex-col items-center gap-3 py-10 text-center">
                <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                <p class="text-sm text-muted">
                    {{ products.length === 0 ? emptyMessage : "No products match your search." }}
                </p>
                <BaseButton
                    v-if="products.length === 0 && emptyActionTo"
                    size="sm"
                    color="neutral"
                    variant="soft"
                    :to="emptyActionTo"
                >
                    {{ emptyActionLabel }}
                </BaseButton>
            </div>

            <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <ProductShowcaseCard
                    v-for="product in visibleProducts"
                    :key="product.uuid"
                    :product="product"
                    @select="emit('select', product)"
                />
            </div>

            <div v-if="hasMore" class="flex justify-center">
                <BaseButton color="neutral" variant="outline" @click="loadMore">
                    Load more
                </BaseButton>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { Product } from '@/types/Product'

const props = withDefaults(defineProps<{
    products: Product[]
    search: string
    loading: boolean
    error: string
    emptyMessage?: string
    emptyActionTo?: string
    emptyActionLabel?: string
}>(), {
    emptyMessage: 'No products yet. Check back soon.',
    emptyActionLabel: 'Browse other products'
})

const emit = defineEmits<{
    select: [product: Product]
    retry: []
}>()

const filteredProducts = computed(() => {
    const query = props.search.trim().toLowerCase()
    if (!query) return props.products
    return props.products.filter((product) => product.name.toLowerCase().includes(query))
})

const isDesktop = useIsDesktop()
const initialBatchSize = computed(() => isDesktop.value ? 24 : 16)
const visibleCount = ref(initialBatchSize.value)

const visibleProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filteredProducts.value.length)

function loadMore() {
    visibleCount.value += initialBatchSize.value
}

watch([() => props.search, isDesktop, () => props.products], () => {
    visibleCount.value = initialBatchSize.value
})
</script>
