<template>
    <div class="min-h-full space-y-4" @touchstart="onTabsTouchStart" @touchmove="onTabsTouchMove" @touchend="onTabsTouchEnd">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Products</h1>
            <BaseButton icon="i-lucide-plus" class="hidden sm:inline-flex" @click="onAddClick">{{ addLabel }}</BaseButton>
        </div>

        <FabButton :aria-label="addLabel" @click="onAddClick" />

        <BaseTabs v-model="activeTab" :items="tabs" variant="link" class="w-full">
            <template #products>
                <div class="overflow-x-clip">
                    <div class="mt-4" ref="panelEl">
                        <ProductsPanel
                            ref="productsPanelRef"
                            :all-categories="leafCategories"
                            :all-brands="allBrands"
                            :focus-category-uuid="focusCategoryUuid"
                        />
                    </div>
                </div>
            </template>

            <template #categories>
                <div class="overflow-x-clip">
                    <div class="mt-4" ref="panelEl">
                        <CategoriesPanel
                            ref="categoriesPanelRef"
                            :all-categories="allCategories"
                            @categories-updated="onCategoriesUpdated"
                            @view-products="onViewCategoryProducts"
                        />
                    </div>
                </div>
            </template>

            <template #brands>
                <div class="overflow-x-clip">
                    <div class="mt-4" ref="panelEl">
                        <BrandsPanel
                            ref="brandsPanelRef"
                            :all-brands="allBrands"
                            @brands-updated="(list) => (allBrands = list)"
                        />
                    </div>
                </div>
            </template>
        </BaseTabs>
    </div>
</template>

<script setup lang="ts">
import { productCategoryService } from '@/components/api/admin/ProductCategoryService'
import { brandService } from '@/components/api/admin/BrandService'
import APIError from '@/components/api/user/APIError'
import type { Category } from '@/types/Category'
import type { Brand } from '@/types/Brand'
import type { TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Products' })

const toast = useToast()

const activeTab = ref<'products' | 'categories' | 'brands'>('products')

const tabs = computed<TabsItem[]>(() => [
    { label: 'Products', icon: 'i-lucide-package', value: 'products', slot: 'products' },
    { label: 'Categories', icon: 'i-lucide-tags', value: 'categories', slot: 'categories' },
    { label: 'Brands', icon: 'i-lucide-tag', value: 'brands', slot: 'brands' }
])

const { onTouchStart: onTabsTouchStart, onTouchMove: onTabsTouchMove, onTouchEnd: onTabsTouchEnd, panelEl } = useSwipeTabs(
    activeTab,
    computed(() => tabs.value.map((tab) => tab.value as 'products' | 'categories' | 'brands'))
)

const { data: allCategories, ensure: ensureCategoriesLoaded } = useCachedFetch<Category[]>(
    'admin-product-categories',
    (etag) => productCategoryService.fetchCategoriesCacheable({ per_page: 200 }, etag)
)
const { data: leafCategories, ensure: ensureLeafCategoriesLoaded } = useCachedFetch<Category[]>(
    'admin-product-categories-leaf',
    (etag) => productCategoryService.fetchCategoriesCacheable({ per_page: 200, leaf_only: true }, etag)
)
const { data: allBrands, ensure: ensureBrandsLoaded } = useCachedFetch<Brand[]>(
    'admin-brands',
    (etag) => brandService.fetchBrandsCacheable({ per_page: 200 }, etag)
)

const focusCategoryUuid = ref<string | null>(null)

function onViewCategoryProducts(category: Category) {
    focusCategoryUuid.value = category.uuid
    activeTab.value = 'products'
}

function onCategoriesUpdated(list: Category[]) {
    allCategories.value = list
    ensureLeafCategoriesLoaded(true).catch((error) => {
        toast.add({ title: 'Failed to refresh categories', description: (error as APIError).message, color: 'error' })
    })
}

const addLabel = computed(() => {
    if (activeTab.value === 'categories') return 'Add Category'
    if (activeTab.value === 'brands') return 'Add Brand'
    return 'Add Product'
})

interface PanelHandle {
    openCreateModal: () => void
    reload: () => Promise<void>
}

const productsPanelRef = ref<PanelHandle | null>(null)
const categoriesPanelRef = ref<PanelHandle | null>(null)
const brandsPanelRef = ref<PanelHandle | null>(null)

function onAddClick() {
    if (activeTab.value === 'categories') categoriesPanelRef.value?.openCreateModal()
    else if (activeTab.value === 'brands') brandsPanelRef.value?.openCreateModal()
    else productsPanelRef.value?.openCreateModal()
}

onMounted(() => {
    ensureCategoriesLoaded().catch((error) => {
        toast.add({ title: 'Failed to load categories', description: (error as APIError).message, color: 'error' })
    })
    ensureLeafCategoriesLoaded().catch((error) => {
        toast.add({ title: 'Failed to load categories', description: (error as APIError).message, color: 'error' })
    })
    ensureBrandsLoaded().catch((error) => {
        toast.add({ title: 'Failed to load brands', description: (error as APIError).message, color: 'error' })
    })
})

onPullToRefresh(() => Promise.all([
    ensureCategoriesLoaded(true),
    ensureLeafCategoriesLoaded(true),
    ensureBrandsLoaded(true),
    productsPanelRef.value?.reload?.(),
    categoriesPanelRef.value?.reload?.(),
    brandsPanelRef.value?.reload?.()
]))
</script>
