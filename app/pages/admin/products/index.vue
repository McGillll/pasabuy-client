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
        </BaseTabs>
    </div>
</template>

<script setup lang="ts">
import { productCategoryService } from '@/components/api/admin/ProductCategoryService'
import APIError from '@/components/api/user/APIError'
import type { Category } from '@/types/Category'
import type { TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Products' })

const toast = useToast()

const activeTab = ref<'products' | 'categories'>('products')

const tabs = computed<TabsItem[]>(() => [
    { label: 'Products', icon: 'i-lucide-package', value: 'products', slot: 'products' },
    { label: 'Categories', icon: 'i-lucide-tags', value: 'categories', slot: 'categories' }
])

const { onTouchStart: onTabsTouchStart, onTouchMove: onTabsTouchMove, onTouchEnd: onTabsTouchEnd, panelEl } = useSwipeTabs(
    activeTab,
    computed(() => tabs.value.map((tab) => tab.value as 'products' | 'categories'))
)

const { data: allCategories, ensure: ensureCategoriesLoaded } = useCachedFetch<Category[]>(
    'admin-product-categories',
    (etag) => productCategoryService.fetchCategoriesCacheable({ per_page: 200 }, etag)
)
const { data: leafCategories, ensure: ensureLeafCategoriesLoaded } = useCachedFetch<Category[]>(
    'admin-product-categories-leaf',
    (etag) => productCategoryService.fetchCategoriesCacheable({ per_page: 200, leaf_only: true }, etag)
)

const focusCategoryUuid = ref<string | null>(null)

function onViewCategoryProducts(category: Category) {
    focusCategoryUuid.value = category.uuid
    activeTab.value = 'products'
}

function onCategoriesUpdated(list: Category[]) {
    allCategories.value = list
    ensureLeafCategoriesLoaded(true).catch((error) => {
        toast.add({
            title: 'Failed to refresh categories',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => { ensureLeafCategoriesLoaded(true) } }]
        })
    })
}

const addLabel = computed(() => {
    if (activeTab.value === 'categories') return 'Add Category'
    return 'Add Product'
})

interface PanelHandle {
    openCreateModal: () => void
    reload: () => Promise<void>
}

const productsPanelRef = ref<PanelHandle | null>(null)
const categoriesPanelRef = ref<PanelHandle | null>(null)

function onAddClick() {
    if (activeTab.value === 'categories') categoriesPanelRef.value?.openCreateModal()
    else productsPanelRef.value?.openCreateModal()
}

onMounted(() => {
    ensureCategoriesLoaded().catch((error) => {
        toast.add({
            title: 'Failed to load categories',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => { ensureCategoriesLoaded(true) } }]
        })
    })
    ensureLeafCategoriesLoaded().catch((error) => {
        toast.add({
            title: 'Failed to load categories',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => { ensureLeafCategoriesLoaded(true) } }]
        })
    })
})

onPullToRefresh(() => Promise.all([
    ensureCategoriesLoaded(true),
    ensureLeafCategoriesLoaded(true),
    productsPanelRef.value?.reload?.(),
    categoriesPanelRef.value?.reload?.()
]))
</script>
