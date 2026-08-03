<template>
    <div class="space-y-6">
        <div class="sticky top-0 z-10 -mx-4 bg-default/95 px-4 py-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <BaseSearchInput
                v-model="search"
                :items="suggestionItems"
                placeholder="Search products…"
                class="w-full"
                @select="onSuggestionSelect"
            >
                <template #item-leading="{ item }">
                    <img
                        v-if="item.product.image_url"
                        :src="item.product.image_url"
                        class="size-8 rounded-md object-cover"
                        alt=""
                    >
                    <div v-else class="flex size-8 items-center justify-center rounded-md bg-elevated text-dimmed">
                        <UIcon name="i-lucide-image" class="size-4" />
                    </div>
                </template>
                <template #item-trailing="{ item }">
                    <UBadge v-if="item.product.default_product_status === 'b1t1'" color="success" variant="subtle" size="sm">
                        B1T1
                    </UBadge>
                </template>
                <template #empty="{ searchTerm: term }">
                    <div v-if="suggestionsLoading" class="py-1 text-sm text-muted">
                        Searching…
                    </div>
                    <template v-else>
                        {{ term ? `No products match "${term}"` : 'No matching data' }}
                    </template>
                </template>
            </BaseSearchInput>
        </div>

        <div v-if="!loading && !error && promoProducts.length" class="space-y-3">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-tag" class="size-4 text-primary" />
                    <h2 class="text-sm font-semibold text-highlighted">Buy 1 Take 1</h2>
                </div>
                <BaseButton size="xs" color="neutral" variant="link" trailing-icon="i-lucide-chevron-right" to="/customer/products/b1t1">
                    View all
                </BaseButton>
            </div>

            <div class="relative -mx-4">
                <div
                    ref="promoScrollEl"
                    class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
                >
                    <ProductShowcaseCard
                        v-for="product in promoProducts"
                        :key="product.uuid"
                        :product="product"
                        class="w-36 shrink-0 snap-start sm:w-40"
                        @select="openProduct"
                    />
                </div>

                <button
                    v-if="promoCanScrollLeft"
                    type="button"
                    class="absolute left-0 top-1/2 hidden size-9 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-md ring ring-default hover:bg-elevated sm:flex"
                    aria-label="Scroll promotions left"
                    @click="scrollPromoBy(-1)"
                >
                    <UIcon name="i-lucide-chevron-left" class="size-5" />
                </button>
                <button
                    v-if="promoCanScrollRight"
                    type="button"
                    class="absolute right-0 top-1/2 hidden size-9 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-md ring ring-default hover:bg-elevated sm:flex"
                    aria-label="Scroll promotions right"
                    @click="scrollPromoBy(1)"
                >
                    <UIcon name="i-lucide-chevron-right" class="size-5" />
                </button>
            </div>
        </div>

        <div v-else-if="loading" class="space-y-3">
            <USkeleton class="h-5 w-32" />
            <div class="flex gap-3 overflow-hidden">
                <div v-for="n in 4" :key="n" class="w-36 shrink-0 space-y-2 sm:w-40">
                    <USkeleton class="aspect-square w-full rounded-xl" />
                    <USkeleton class="h-4 w-2/3" />
                    <USkeleton class="h-4 w-1/3" />
                </div>
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
                <BaseButton size="xs" color="error" variant="soft" @click="loadCatalog(true)">
                    Retry
                </BaseButton>
            </template>
        </UAlert>

        <div v-else class="flex flex-col items-center gap-3 py-10">
            <UIcon name="i-lucide-tag" class="size-8 text-dimmed" />
            <p class="text-sm text-muted">No Buy 1 Take 1 products right now. Check back soon.</p>
        </div>

        <div v-if="!loading && !error && topSellingProducts.length" class="space-y-3">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-flame" class="size-4 text-primary" />
                    <h2 class="text-sm font-semibold text-highlighted">Best sellers</h2>
                </div>
                <BaseButton size="xs" color="neutral" variant="link" trailing-icon="i-lucide-chevron-right" to="/customer/products/top-selling">
                    View all
                </BaseButton>
            </div>

            <div class="relative -mx-4">
                <div
                    ref="topSellingScrollEl"
                    class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
                >
                    <ProductShowcaseCard
                        v-for="product in topSellingProducts"
                        :key="product.uuid"
                        :product="product"
                        class="w-36 shrink-0 snap-start sm:w-40"
                        @select="openProduct"
                    />
                </div>

                <button
                    v-if="topSellingCanScrollLeft"
                    type="button"
                    class="absolute left-0 top-1/2 hidden size-9 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-md ring ring-default hover:bg-elevated sm:flex"
                    aria-label="Scroll best sellers left"
                    @click="scrollTopSellingBy(-1)"
                >
                    <UIcon name="i-lucide-chevron-left" class="size-5" />
                </button>
                <button
                    v-if="topSellingCanScrollRight"
                    type="button"
                    class="absolute right-0 top-1/2 hidden size-9 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-md ring ring-default hover:bg-elevated sm:flex"
                    aria-label="Scroll best sellers right"
                    @click="scrollTopSellingBy(1)"
                >
                    <UIcon name="i-lucide-chevron-right" class="size-5" />
                </button>
            </div>
        </div>

        <div v-else-if="loading" class="space-y-3">
            <USkeleton class="h-5 w-32" />
            <div class="flex gap-3 overflow-hidden">
                <div v-for="n in 4" :key="`top-${n}`" class="w-36 shrink-0 space-y-2 sm:w-40">
                    <USkeleton class="aspect-square w-full rounded-xl" />
                    <USkeleton class="h-4 w-2/3" />
                    <USkeleton class="h-4 w-1/3" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { publicProductService } from '@/components/api/public/PublicProductService'
import APIError from '@/components/api/user/APIError'
import type { InputMenuItem } from '@nuxt/ui'
import type { Product } from '@/types/Product'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

useHead({ title: 'Pasabuy' })

const { data: promoData, ensure: ensurePromoLoaded } = useCachedFetch<Product[]>(
    'public-product-catalog-b1t1',
    (etag) => publicProductService.fetchCatalogCacheable({ status: 'b1t1', per_page: 200 }, etag)
)

const { data: topSellingData, ensure: ensureTopSellingLoaded } = useCachedFetch<Product[]>(
    'public-product-catalog-top-selling',
    (etag) => publicProductService.fetchTopSellingCacheable({ limit: 10 }, etag)
)

const loading = ref(true)
const error = ref('')

const promoProducts = computed(() => promoData.value ?? [])
const topSellingProducts = computed(() => topSellingData.value ?? [])

const {
    el: promoScrollEl,
    canScrollLeft: promoCanScrollLeft,
    canScrollRight: promoCanScrollRight,
    scrollBy: scrollPromoBy,
    update: updatePromoScroll
} = useHorizontalScroll()

const {
    el: topSellingScrollEl,
    canScrollLeft: topSellingCanScrollLeft,
    canScrollRight: topSellingCanScrollRight,
    scrollBy: scrollTopSellingBy,
    update: updateTopSellingScroll
} = useHorizontalScroll()

watch(promoProducts, () => nextTick(updatePromoScroll))
watch(topSellingProducts, () => nextTick(updateTopSellingScroll))

const { set: setPreviewProduct } = useProductPreviewCache()

function openProduct(product: Product) {
    setPreviewProduct(product)
    navigateTo(`/customer/product/${product.uuid}`)
}

const search = ref('')
const suggestionItems = ref<InputMenuItem[]>([])
const suggestionsLoading = ref(false)
let suggestionRequestId = 0

async function fetchSuggestions() {
    const query = search.value.trim()
    if (!query) {
        suggestionsLoading.value = false
        suggestionItems.value = []
        return
    }

    const requestId = ++suggestionRequestId
    suggestionsLoading.value = true
    try {
        const result = await publicProductService.fetchCatalog({ search: query, per_page: 8 })
        if (requestId !== suggestionRequestId) return
        suggestionItems.value = (result.data.items as Product[]).map((product) => ({
            label: product.name,
            description: `₱${product.default_price}${product.category ? ` · ${product.category.name}` : ''}`,
            product
        })) as InputMenuItem[]
    } catch {
        if (requestId !== suggestionRequestId) return
        suggestionItems.value = []
    } finally {
        if (requestId === suggestionRequestId) suggestionsLoading.value = false
    }
}

useSearchDebounce(search, fetchSuggestions, 500)

function onSuggestionSelect(item: InputMenuItem) {
    const product = (item as { product?: Product })?.product
    if (!product) return
    openProduct(product)
}

async function loadCatalog(force = false) {
    loading.value = true
    error.value = ''
    try {
        await Promise.all([ensurePromoLoaded(force), ensureTopSellingLoaded(force)])
    } catch (err) {
        error.value = err instanceof APIError ? err.message : 'Something went wrong loading products.'
    } finally {
        loading.value = false
    }
}

onMounted(() => loadCatalog())
onPullToRefresh(() => loadCatalog(true))
</script>
