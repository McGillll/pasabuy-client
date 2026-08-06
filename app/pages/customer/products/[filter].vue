<template>
    <div class="space-y-6">
        <div>
            <template v-if="isCategoryFilter">
                <BaseButton size="sm" color="neutral" variant="ghost" icon="i-lucide-arrow-left" class="-ml-2 mb-2 md:hidden" @click="goBack(backTo)">
                    Back
                </BaseButton>
                <BaseBreadcrumb :items="crumbs" class="mb-2 hidden md:block" />
            </template>
            <BaseButton v-else size="sm" color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/customer" class="-ml-2">
                Home
            </BaseButton>

            <div v-if="!notFound" class="mt-2 flex items-center gap-2">
                <UIcon :name="collectionIcon" class="size-5 text-primary" />
                <h1 class="text-xl font-semibold text-highlighted">{{ collectionTitle }}</h1>
            </div>
        </div>

        <UAlert
            v-if="notFound"
            color="error"
            variant="subtle"
            title="Collection not found"
            description="This product collection doesn't exist or is no longer available."
        />

        <template v-else>
            <BaseInput v-model="search" icon="i-lucide-search" placeholder="Search products…" />

            <ProductGridSection
                :products="products"
                :search="debouncedSearch"
                :loading="loading"
                :error="error"
                :empty-message="`No products in ${collectionTitle} right now. Check back soon.`"
                empty-action-to="/customer/aisles"
                empty-action-label="Browse aisles"
                @select="openProduct"
                @retry="loadCollection"
            />
        </template>
    </div>
</template>

<script setup lang="ts">
import { publicProductService } from '@/components/api/public/PublicProductService'
import APIError from '@/components/api/user/APIError'
import type { BaseBreadcrumbItem } from '@/components/base/BaseBreadcrumb.vue'
import type { Product } from '@/types/Product'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

const route = useRoute()
const filterKey = computed(() => route.params.filter as string)

const isB1T1 = computed(() => filterKey.value === 'b1t1')
const isTopSelling = computed(() => filterKey.value === 'top-selling')
const isCategoryFilter = computed(() => !isB1T1.value && !isTopSelling.value)

const { ancestors, resolve: resolveAncestors } = useCategoryAncestors()
const { goBack } = useSmartBack()

const backTo = computed(() => (matchedCategory.value?.parent_uuid ? `/customer/aisles/${matchedCategory.value.parent_uuid}` : '/customer/aisles'))

const crumbs = computed<BaseBreadcrumbItem[]>(() => {
    const trail: BaseBreadcrumbItem[] = [
        { label: 'Aisles', to: '/customer/aisles', onBack: () => goBack('/customer/aisles') },
        ...ancestors.value.map((ancestor) => ({
            label: ancestor.name,
            to: `/customer/aisles/${ancestor.uuid}`,
            onBack: () => goBack(`/customer/aisles/${ancestor.uuid}`)
        }))
    ]
    if (matchedCategory.value) trail.push({ label: matchedCategory.value.name })
    return trail
})

const products = ref<Product[]>([])
const matchedCategory = ref<Product['category']>(null)
const loading = ref(true)
const error = ref('')
const loaded = ref(false)

const notFound = computed(() => loaded.value && !error.value && !isB1T1.value && !isTopSelling.value && !matchedCategory.value)

const collectionTitle = computed(() => {
    if (isB1T1.value) return 'Buy 1 Take 1'
    if (isTopSelling.value) return 'Best Sellers'
    return matchedCategory.value?.name ?? 'Products'
})

const collectionIcon = computed(() => {
    if (isB1T1.value) return 'i-lucide-tag'
    if (isTopSelling.value) return 'i-lucide-flame'
    return 'i-lucide-shapes'
})

useHead({ title: computed(() => collectionTitle.value) })

const search = ref('')
const debouncedSearch = ref('')
useSearchDebounce(search, () => { debouncedSearch.value = search.value })

const { set: setPreviewProduct } = useProductPreviewCache()

function openProduct(product: Product) {
    setPreviewProduct(product)
    navigateTo(`/customer/product/${product.uuid}`)
}

async function loadCollection() {
    loading.value = true
    error.value = ''
    loaded.value = false
    try {
        let items: Product[]
        if (isTopSelling.value) {
            const result = await publicProductService.fetchTopSelling({ limit: 10 })
            items = result.data as Product[]
        } else {
            const params = isB1T1.value
                ? { status: 'b1t1', per_page: 200 }
                : { category_uuid: filterKey.value, per_page: 200 }
            const result = await publicProductService.fetchCatalog(params)
            items = result.data.items as Product[]
        }
        products.value = items
        matchedCategory.value = (isB1T1.value || isTopSelling.value) ? null : (items[0]?.category ?? null)
        await resolveAncestors(matchedCategory.value)
    } catch (err) {
        error.value = err instanceof APIError ? err.message : 'Something went wrong loading products.'
    } finally {
        loading.value = false
        loaded.value = true
    }
}

onMounted(() => loadCollection())
watch(filterKey, () => loadCollection())
onPullToRefresh(() => loadCollection())
</script>
