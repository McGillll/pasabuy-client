<template>
    <div class="space-y-6">
        <div>
            <BaseButton v-if="categoryUuid" size="sm" color="neutral" variant="ghost" icon="i-lucide-arrow-left" :to="backTo" class="-ml-2">
                Back
            </BaseButton>

            <div v-if="!notFound" class="mb-2 items-center gap-2" :class="categoryUuid ? 'flex' : 'hidden md:flex'">
                <UIcon name="i-lucide-shopping-basket" class="size-5 text-primary" />
                <h1 class="text-xl font-semibold text-highlighted">{{ title }}</h1>
            </div>

            <div v-if="!categoryUuid" class="md:hidden sticky top-0 z-10 -mx-4 bg-default px-4 py-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]">
                <Teleport to="#customer-header-search-target" :disabled="!isDesktop">
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
                </Teleport>
            </div>
        </div>

        <div class="md:rounded-2xl md:border md:border-default md:bg-muted md:p-6 md:shadow-sm">
            <UAlert
                v-if="notFound"
                color="error"
                variant="subtle"
                title="Aisle not found"
                description="This category doesn't exist or is no longer available."
            />

            <div v-else-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <div v-for="n in 8" :key="n" class="space-y-2">
                    <USkeleton class="aspect-square w-full rounded-xl" />
                    <USkeleton class="h-3 w-3/4" />
                </div>
            </div>

            <UAlert
                v-else-if="error"
                color="error"
                variant="subtle"
                title="Failed to load"
                :description="error"
            >
                <template #actions>
                    <BaseButton size="xs" color="error" variant="soft" @click="load(true)">
                        Retry
                    </BaseButton>
                </template>
            </UAlert>

            <div v-else-if="isLeaf" class="space-y-3">
                <div class="relative -mx-4">
                    <div
                        ref="leafScrollEl"
                        class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden"
                    >
                        <ProductShowcaseCard
                            v-for="product in leafProducts"
                            :key="product.uuid"
                            :product="product"
                            class="w-36 shrink-0 snap-start sm:w-40"
                            @select="openProduct"
                        />
                    </div>

                    <button
                        v-if="leafCanScrollLeft"
                        type="button"
                        class="absolute left-0 top-1/2 hidden size-9 -translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-sm ring ring-default hover:bg-elevated sm:flex"
                        aria-label="Scroll aisle left"
                        @click="scrollLeafBy(-1)"
                    >
                        <UIcon name="i-lucide-chevron-left" class="size-5" />
                    </button>
                    <button
                        v-if="leafCanScrollRight"
                        type="button"
                        class="absolute right-0 top-1/2 hidden size-9 translate-x-1/3 -translate-y-1/2 items-center justify-center rounded-full bg-default text-highlighted shadow-sm ring ring-default hover:bg-elevated sm:flex"
                        aria-label="Scroll aisle right"
                        @click="scrollLeafBy(1)"
                    >
                        <UIcon name="i-lucide-chevron-right" class="size-5" />
                    </button>
                </div>

                <BaseButton
                    v-if="hasMoreProducts"
                    block
                    color="neutral"
                    variant="outline"
                    trailing-icon="i-lucide-chevron-right"
                    :to="`/customer/products/${categoryUuid}`"
                >
                    Explore aisle
                </BaseButton>

                <div v-if="!leafProducts.length" class="flex flex-col items-center gap-3 py-10">
                    <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                    <p class="text-sm text-muted">No products in this aisle yet. Check back soon.</p>
                </div>
            </div>

            <div v-else-if="children.length" class="space-y-8">
                <div v-if="branchChildren.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <CategoryTile
                        v-for="(child, index) in branchChildren"
                        :key="child.uuid"
                        :category="child"
                        :wide="isOddLastTile(index)"
                        :class="{ 'col-span-2': isOddLastTile(index) }"
                        @select="openCategory"
                    />
                </div>

                <CategoryPreviewSection
                    v-for="child in leafChildren"
                    :key="child.uuid"
                    :category="child"
                    @select="openProduct"
                />
            </div>

            <div v-else class="flex flex-col items-center gap-3 py-10">
                <UIcon name="i-lucide-shopping-basket" class="size-8 text-dimmed" />
                <p class="text-sm text-muted">No aisles to browse right now. Check back soon.</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { publicProductCategoryService } from '@/components/api/public/PublicProductCategoryService'
import { publicProductService } from '@/components/api/public/PublicProductService'
import APIError from '@/components/api/user/APIError'
import type { InputMenuItem } from '@nuxt/ui'
import type { Category } from '@/types/Category'
import type { Product } from '@/types/Product'

const props = defineProps<{
    categoryUuid?: string
}>()

const isDesktop = useIsDesktop(768)

const category = ref<Category | null>(null)
const children = ref<Category[]>([])
const leafProducts = ref<Product[]>([])
const hasMoreProducts = ref(false)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)

const isLeaf = computed(() => !!props.categoryUuid && !notFound.value && children.value.length === 0)
const branchChildren = computed(() => children.value.filter((child) => child.has_children))
const leafChildren = computed(() => children.value.filter((child) => !child.has_children))

function isOddLastTile(index: number) {
    return branchChildren.value.length % 2 === 1 && index === branchChildren.value.length - 1
}

const title = computed(() => category.value?.name ?? 'Aisles')

const backTo = computed(() => (category.value?.parent_uuid ? `/customer/aisles/${category.value.parent_uuid}` : '/customer/aisles'))

useHead({ title: computed(() => title.value) })

const {
    el: leafScrollEl,
    canScrollLeft: leafCanScrollLeft,
    canScrollRight: leafCanScrollRight,
    scrollBy: scrollLeafBy,
    update: updateLeafScroll
} = useHorizontalScroll()

watch(leafProducts, () => nextTick(updateLeafScroll))

const { set: setPreviewProduct } = useProductPreviewCache()

function openProduct(product: Product) {
    setPreviewProduct(product)
    navigateTo(`/customer/product/${product.uuid}`)
}

function openCategory(target: Category) {
    navigateTo(`/customer/aisles/${target.uuid}`)
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

async function load(force = false) {
    loading.value = true
    error.value = ''
    notFound.value = false
    leafProducts.value = []
    hasMoreProducts.value = false

    try {
        if (props.categoryUuid) {
            const result = await publicProductCategoryService.fetchByUuidCacheable(props.categoryUuid, null)
            if (result !== 'not-modified') category.value = result.data as Category
        } else {
            category.value = null
        }

        const childrenResult = await publicProductCategoryService.fetchChildrenCacheable(
            { parent_uuid: props.categoryUuid },
            null
        )
        if (childrenResult !== 'not-modified') children.value = childrenResult.data as Category[]

        if (props.categoryUuid && children.value.length === 0) {
            const productResult = await publicProductService.fetchCatalog({ category_uuid: props.categoryUuid, per_page: 11 })
            const items = productResult.data.items as Product[]
            hasMoreProducts.value = items.length > 10
            leafProducts.value = items.slice(0, 10)
        }
    } catch (err) {
        if (err instanceof APIError && err.status === 404) {
            notFound.value = true
        } else {
            error.value = err instanceof APIError ? err.message : 'Something went wrong loading this aisle.'
        }
    } finally {
        loading.value = false
    }
}

onMounted(() => load())
watch(() => props.categoryUuid, () => load())
onPullToRefresh(() => load(true))
</script>
