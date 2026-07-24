<template>
    <div class="min-h-full space-y-4" @touchstart="onTabsTouchStart" @touchmove="onTabsTouchMove" @touchend="onTabsTouchEnd">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Products</h1>
            <BaseButton v-if="activeTab === 'products'" icon="i-lucide-plus" class="hidden sm:inline-flex" @click="openProductCreateModal">Add Product</BaseButton>
            <BaseButton v-else icon="i-lucide-plus" class="hidden sm:inline-flex" @click="openCategoryCreateModal">Add Category</BaseButton>
        </div>

        <FabButton v-if="activeTab === 'products'" aria-label="Add product" @click="openProductCreateModal" />
        <FabButton v-else aria-label="Add category" @click="openCategoryCreateModal" />

        <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #products>
                <div class="overflow-hidden">
                <div class="mt-4 space-y-4" ref="panelEl">
                    <SearchInput v-model="productSearch" placeholder="Search products…" />

                    <div v-if="categoryFilterTabs.length > 2" data-swipe-ignore>
                        <UTabs
                            v-model="productCategoryFilter"
                            :items="categoryFilterTabs"
                            variant="pill"
                            size="md"
                            class="w-full"
                            :ui="{ list: 'flex-nowrap overflow-x-auto', trigger: 'grow-0 shrink-0 min-w-20 justify-center py-2.5' }"
                        />
                    </div>

                    <div class="hidden sm:grid grid-cols-4 gap-2">
                        <USelect
                            v-model="productStatusFilter"
                            :items="statusFilterOptions"
                            value-key="value"
                            placeholder="Status"
                            class="w-full"
                        />
                        <USelect
                            v-model="productSortByPrice"
                            :items="sortByPriceOptions"
                            value-key="value"
                            placeholder="Sort by price"
                            class="w-full"
                        />
                        <UInput
                            v-model.number="productPriceMin"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Min price"
                            class="w-full"
                        />
                        <UInput
                            v-model.number="productPriceMax"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Max price"
                            class="w-full"
                        />
                    </div>

                    <BaseButton
                        class="sm:hidden"
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-list-filter"
                        @click="isProductFiltersOpen = true"
                    >
                        Filters
                        <UBadge v-if="productActiveFilterCount" color="primary" variant="subtle" size="sm">{{ productActiveFilterCount }}</UBadge>
                    </BaseButton>

                    <USlideover v-model:open="isProductFiltersOpen" side="bottom" title="Filters">
                        <template #body>
                            <div class="space-y-4">
                                <UFormField label="Status">
                                    <USelect v-model="productStatusFilter" :items="statusFilterOptions" value-key="value" class="w-full" />
                                </UFormField>
                                <UFormField label="Sort by price">
                                    <USelect v-model="productSortByPrice" :items="sortByPriceOptions" value-key="value" class="w-full" />
                                </UFormField>
                                <div class="grid grid-cols-2 gap-4">
                                    <UFormField label="Min price">
                                        <UInput v-model.number="productPriceMin" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" />
                                    </UFormField>
                                    <UFormField label="Max price">
                                        <UInput v-model.number="productPriceMax" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" />
                                    </UFormField>
                                </div>
                            </div>
                        </template>
                        <template #footer>
                            <div class="w-full flex items-center gap-2">
                                <BaseButton class="flex-1" color="neutral" variant="outline" @click="clearProductFilters">Clear filters</BaseButton>
                                <BaseButton class="flex-1" @click="isProductFiltersOpen = false">Done</BaseButton>
                            </div>
                        </template>
                    </USlideover>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <ResponsiveTable
                            :data="products"
                            :columns="productColumns"
                            :loading="productsLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                        >
                            <template #image-cell="{ row }">
                                <img
                                    v-if="row.original.image_url && !imageLoadFailed[row.original.uuid]"
                                    :src="row.original.image_url"
                                    loading="lazy"
                                    class="size-12 rounded-lg object-cover ring-1 ring-default"
                                    alt=""
                                    @error="onImageError(row.original.uuid)"
                                >
                                <div v-else class="flex items-center justify-center size-12 rounded-lg bg-elevated text-dimmed">
                                    <UIcon name="i-lucide-image" class="size-5" />
                                </div>
                            </template>
                            <template #product-cell="{ row }">
                                <p class="font-medium text-highlighted">{{ row.original.name }}</p>
                                <p v-if="row.original.description" class="text-sm text-muted truncate max-w-xs">
                                    {{ row.original.description }}
                                </p>
                            </template>
                            <template #category-cell="{ row }">
                                <span class="text-sm text-muted">{{ row.original.category?.name ?? '-' }}</span>
                            </template>
                            <template #default_price-cell="{ row }">
                                <span class="font-medium text-highlighted">₱{{ row.original.default_price }}</span>
                            </template>
                            <template #is_active-cell="{ row }">
                                <StatusBadge
                                    :color="row.original.is_active ? 'success' : 'neutral'"
                                    :label="row.original.is_active ? 'Active' : 'Inactive'"
                                />
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end gap-1">
                                    <BaseButton
                                        icon="i-lucide-pencil"
                                        size="sm"
                                        color="neutral"
                                        variant="ghost"
                                        aria-label="Edit product"
                                        @click="openProductEditModal(row.original)"
                                    />
                                    <BaseButton
                                        icon="i-lucide-trash-2"
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Delete product"
                                        @click="onDeleteProduct(row.original)"
                                    />
                                </div>
                            </template>
                            <template #list-item="{ item: product }">
                                <ListCard :dimmed="!product.is_active" :actions="productActions(product)">
                                    <template #leading>
                                        <img
                                            v-if="product.image_url && !imageLoadFailed[product.uuid]"
                                            :src="product.image_url"
                                            loading="lazy"
                                            class="size-12 rounded-lg object-cover ring-1 ring-default"
                                            alt=""
                                            @error="onImageError(product.uuid)"
                                        >
                                        <div v-else class="flex items-center justify-center size-12 rounded-lg bg-elevated text-dimmed">
                                            <UIcon name="i-lucide-image" class="size-5" />
                                        </div>
                                    </template>
                                    <template #title>
                                        <p class="font-medium text-highlighted">{{ product.name }}</p>
                                    </template>
                                    <template #subtitle>
                                        <span v-if="product.description" class="truncate">{{ product.description }}</span>
                                    </template>
                                    <template #meta>
                                        <span class="text-muted">{{ product.category?.name ?? '-' }}</span>
                                        <span class="font-medium text-highlighted">₱{{ product.default_price }}</span>
                                    </template>
                                    <template #status>
                                        <StatusBadge
                                            :color="product.is_active ? 'success' : 'neutral'"
                                            :label="product.is_active ? 'Active' : 'Inactive'"
                                        />
                                    </template>
                                </ListCard>
                            </template>
                            <template #empty>
                                <TableEmptyState
                                    icon="i-lucide-package-search"
                                    message="No products found."
                                    action-label="Add your first product"
                                    @action="openProductCreateModal"
                                />
                            </template>
                        </ResponsiveTable>
                    </UCard>

                    <div v-if="productsTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="productsPage" :total="productsTotal" :items-per-page="perPage" />
                    </div>
                </div>
                </div>
            </template>

            <template #categories>
                <div class="overflow-hidden">
                <div class="mt-4 space-y-4" ref="panelEl">
                    <SearchInput v-model="categorySearch" placeholder="Search categories…" />

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <ResponsiveTable
                            :data="categories"
                            :columns="categoryColumns"
                            :loading="categoriesLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors cursor-pointer' }"
                            @select="(_event: Event, row: { original: Category }) => viewCategoryProducts(row.original)"
                        >
                            <template #category-cell="{ row }">
                                <p class="font-medium text-highlighted">{{ row.original.name }}</p>
                                <p v-if="row.original.description" class="text-sm text-muted truncate max-w-xs">
                                    {{ row.original.description }}
                                </p>
                            </template>
                            <template #is_active-cell="{ row }">
                                <StatusBadge
                                    :color="row.original.is_active ? 'success' : 'neutral'"
                                    :label="row.original.is_active ? 'Active' : 'Inactive'"
                                />
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end gap-1">
                                    <BaseButton
                                        icon="i-lucide-pencil"
                                        size="sm"
                                        color="neutral"
                                        variant="ghost"
                                        aria-label="Edit category"
                                        @click.stop="openCategoryEditModal(row.original)"
                                    />
                                    <BaseButton
                                        icon="i-lucide-trash-2"
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Delete category"
                                        @click.stop="onDeleteCategory(row.original)"
                                    />
                                </div>
                            </template>
                            <template #list-item="{ item: category }">
                                <ListCard clickable :dimmed="!category.is_active" :actions="categoryActions(category)" @click="viewCategoryProducts(category)">
                                    <template #title>
                                        <p class="font-medium text-highlighted">{{ category.name }}</p>
                                    </template>
                                    <template #subtitle>
                                        <span v-if="category.description" class="truncate">{{ category.description }}</span>
                                    </template>
                                    <template #status>
                                        <StatusBadge
                                            :color="category.is_active ? 'success' : 'neutral'"
                                            :label="category.is_active ? 'Active' : 'Inactive'"
                                        />
                                    </template>
                                </ListCard>
                            </template>
                            <template #empty>
                                <TableEmptyState
                                    icon="i-lucide-tags"
                                    message="No categories found."
                                    action-label="Add your first category"
                                    @action="openCategoryCreateModal"
                                />
                            </template>
                        </ResponsiveTable>
                    </UCard>

                    <div v-if="categoriesTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="categoriesPage" :total="categoriesTotal" :items-per-page="perPage" />
                    </div>
                </div>
                </div>
            </template>
        </UTabs>

        <BaseModal
            v-model:open="isProductModalOpen"
            :title="editingProduct ? 'Edit Product' : 'Add Product'"
            size="xl"
            show-default-footer
            form-id="product-form"
            :confirm-label="editingProduct ? 'Save' : 'Create'"
            :loading="savingProduct"
        >
            <form id="product-form" class="space-y-6" @submit.prevent="onSaveProduct">
                <div class="flex flex-col sm:flex-row gap-6">
                    <div class="sm:w-48 shrink-0 space-y-4">
                        <UFormField label="Image">
                            <UFileUpload v-model="productForm.image" accept="image/*">
                                <template #default="{ open }">
                                    <div class="flex items-center gap-3 sm:flex-col sm:items-stretch">
                                        <div
                                            class="relative shrink-0 size-24 sm:size-auto sm:w-full sm:aspect-square rounded-lg overflow-hidden ring-1 ring-default bg-elevated cursor-pointer"
                                            @click="open()"
                                        >
                                            <img
                                                v-if="productImagePreviewUrl"
                                                :src="productImagePreviewUrl"
                                                class="size-full object-cover"
                                                alt=""
                                            >
                                            <div v-else class="flex items-center justify-center size-full text-dimmed">
                                                <UIcon name="i-lucide-image-plus" class="size-6" />
                                            </div>
                                            <BaseButton
                                                v-if="productForm.image"
                                                icon="i-lucide-x"
                                                size="xs"
                                                color="neutral"
                                                variant="solid"
                                                class="absolute top-1 right-1 rounded-full"
                                                aria-label="Remove selected image"
                                                @click.stop="productForm.image = null"
                                            />
                                        </div>
                                        <BaseButton
                                            :label="productImagePreviewUrl ? 'Change photo' : 'Add photo'"
                                            color="neutral"
                                            variant="outline"
                                            size="sm"
                                            @click="open()"
                                        />
                                    </div>
                                </template>
                            </UFileUpload>
                        </UFormField>
                        <UFormField label="Active">
                            <USwitch v-model="productForm.is_active" label="Product is active" />
                        </UFormField>
                    </div>
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <UFormField label="Name" required>
                            <UInput v-model="productForm.name" placeholder="Turbo 9inch fan" class="w-full" />
                        </UFormField>
                        <UFormField label="Default price" required>
                            <UInput v-model.number="productForm.default_price" type="number" min="0" step="0.01" placeholder="0.00" class="w-full">
                                <template #leading>
                                    <span class="text-sm text-dimmed">₱</span>
                                </template>
                            </UInput>
                        </UFormField>
                        <UFormField label="Category">
                            <USelect
                                v-model="productForm.category_id"
                                :items="categoryOptions"
                                value-key="value"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Default product status">
                            <USelect
                                v-model="productForm.default_product_status"
                                :items="productStatusOptions"
                                value-key="value"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Description" class="sm:col-span-2">
                            <UTextarea v-model="productForm.description" placeholder="Short product description" class="w-full" :rows="3" />
                        </UFormField>
                    </div>
                </div>
            </form>
        </BaseModal>

        <BaseModal
            v-model:open="isCategoryModalOpen"
            :title="editingCategory ? 'Edit Category' : 'Add Category'"
            show-default-footer
            form-id="category-form"
            :confirm-label="editingCategory ? 'Save' : 'Create'"
            :loading="savingCategory"
        >
            <form id="category-form" class="space-y-4" @submit.prevent="onSaveCategory">
                <UFormField label="Name" required>
                    <UInput v-model="categoryForm.name" placeholder="Appliances" class="w-full" />
                </UFormField>
                <UFormField label="Description">
                    <UTextarea v-model="categoryForm.description" placeholder="Short category description" class="w-full" />
                </UFormField>
                <UFormField label="Active">
                    <UCheckbox v-model="categoryForm.is_active" label="Category is active" />
                </UFormField>
            </form>
        </BaseModal>

        <ConfirmDialogModal
            v-model:open="confirmDialog.open"
            :title="confirmDialog.title"
            :description="confirmDialog.description"
            :color="confirmDialog.color"
            :confirm-label="confirmDialog.confirmLabel"
            :loading="confirming"
            @confirm="confirmDialogAccept"
        />
    </div>
</template>

<script setup lang="ts">
import { productService } from '@/components/api/admin/ProductService'
import { productCategoryService } from '@/components/api/admin/ProductCategoryService'
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'
import type { Category } from '@/types/Category'
import type { DropdownMenuItem, TableColumn, TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Products' })

const toast = useToast()
const perPage = 15

const activeTab = ref<'products' | 'categories'>('products')

const tabs = computed<TabsItem[]>(() => [
    { label: 'Products', icon: 'i-lucide-package', value: 'products', slot: 'products' },
    { label: 'Categories', icon: 'i-lucide-tags', value: 'categories', slot: 'categories' }
])

const { onTouchStart: onTabsTouchStart, onTouchMove: onTabsTouchMove, onTouchEnd: onTabsTouchEnd, panelEl } = useSwipeTabs(
    activeTab,
    computed(() => tabs.value.map((tab) => tab.value as 'products' | 'categories'))
)

// ---- Products ----

const products = ref<Product[]>([])
const { data: allCategories, ensure: ensureCategoriesLoaded } = useCachedFetch<Category[]>(
    'admin-product-categories',
    (etag) => productCategoryService.fetchCategoriesCacheable({ per_page: 200 }, etag)
)
const productsLoading = ref(false)
const productsPage = ref(1)
const productsTotal = ref(0)
const productSearch = ref('')
const productCategoryFilter = ref('all')
const productStatusFilter = ref('all')
const productSortByPrice = ref('none')
const productPriceMin = ref<number | null>(null)
const productPriceMax = ref<number | null>(null)
const isProductFiltersOpen = ref(false)

const productActiveFilterCount = computed(() =>
    [productStatusFilter.value !== 'all', productSortByPrice.value !== 'none', productPriceMin.value !== null, productPriceMax.value !== null]
        .filter(Boolean).length
)

function clearProductFilters() {
    productStatusFilter.value = 'all'
    productSortByPrice.value = 'none'
    productPriceMin.value = null
    productPriceMax.value = null
}

const statusFilterOptions = [
    { label: 'All statuses', value: 'all' },
    { label: 'None', value: 'none' },
    { label: 'B1T1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' }
]

const sortByPriceOptions = [
    { label: 'Default order', value: 'none' },
    { label: 'Price: Low to High', value: 'asc' },
    { label: 'Price: High to Low', value: 'desc' }
]

const imageLoadFailed = ref<Record<string, boolean>>({})

function onImageError(productUuid: string) {
    imageLoadFailed.value[productUuid] = true
}

const categoryOptions = computed(() => [
    { label: 'Uncategorized', value: null },
    ...(allCategories.value ?? []).map((category) => ({ label: category.name, value: category.uuid }))
])

const categoryFilterTabs = computed(() => [
    { label: 'All', value: 'all' },
    ...(allCategories.value ?? []).map((category) => ({ label: category.name, value: category.uuid }))
])

const productStatusOptions = [
    { label: 'None', value: 'none' },
    { label: 'B1T1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' }
]

const productColumns: TableColumn<Product>[] = [
    { id: 'image', header: '' },
    { id: 'product', header: 'Product' },
    { id: 'category', header: 'Category' },
    { id: 'default_price', header: 'Price' },
    { accessorKey: 'is_active', header: 'Status' },
    { id: 'actions', header: '' }
]

async function loadProducts() {
    productsLoading.value = true
    try {
        const response = await productService.fetchProducts({
            page: productsPage.value,
            per_page: perPage,
            search: productSearch.value || undefined,
            category_uuid: productCategoryFilter.value !== 'all' ? productCategoryFilter.value : undefined,
            status: productStatusFilter.value !== 'all' ? productStatusFilter.value : undefined,
            sort_by_price: productSortByPrice.value !== 'none' ? productSortByPrice.value : undefined,
            price_min: productPriceMin.value ?? undefined,
            price_max: productPriceMax.value ?? undefined
        })
        products.value = response.data.data
        productsTotal.value = response.data.total
        productActionsCache.clear()
        imageLoadFailed.value = {}
    } catch (error) {
        toast.add({ title: 'Failed to load products', description: (error as APIError).message, color: 'error' })
    } finally {
        productsLoading.value = false
    }
}

watch(productsPage, loadProducts)

watch([productCategoryFilter, productStatusFilter, productSortByPrice], () => {
    productsPage.value = 1
    loadProducts()
})

useSearchDebounce(productSearch, () => {
    productsPage.value = 1
    loadProducts()
})

let priceRangeDebounce: ReturnType<typeof setTimeout>
watch([productPriceMin, productPriceMax], () => {
    clearTimeout(priceRangeDebounce)
    priceRangeDebounce = setTimeout(() => {
        productsPage.value = 1
        loadProducts()
    }, 300)
})

const isProductModalOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const productForm = reactive({
    name: '',
    description: '',
    is_active: true,
    default_price: null as number | null,
    default_product_status: 'none' as 'none' | 'b1t1' | 'out_of_stock',
    category_id: null as string | null,
    image: null as File | null
})
const savingProduct = ref(false)

const productImagePreviewUrl = ref<string | null>(null)

watch(
    [() => productForm.image, () => editingProduct.value],
    ([image, product], _old, onCleanup) => {
        if (image) {
            const url = URL.createObjectURL(image)
            productImagePreviewUrl.value = url
            onCleanup(() => URL.revokeObjectURL(url))
            return
        }
        productImagePreviewUrl.value = product?.image_url ?? null
    },
    { immediate: true }
)

function openProductCreateModal() {
    editingProduct.value = null
    productForm.name = ''
    productForm.description = ''
    productForm.is_active = true
    productForm.default_price = null
    productForm.default_product_status = 'none'
    productForm.category_id = null
    productForm.image = null
    isProductModalOpen.value = true
}

function openProductEditModal(product: Product) {
    editingProduct.value = product
    productForm.name = product.name
    productForm.description = product.description ?? ''
    productForm.is_active = product.is_active
    productForm.default_price = Number(product.default_price)
    productForm.default_product_status = product.default_product_status
    productForm.category_id = product.category?.uuid ?? null
    productForm.image = null
    isProductModalOpen.value = true
}

async function onSaveProduct() {
    savingProduct.value = true
    try {
        const payload = {
            name: productForm.name,
            description: productForm.description,
            is_active: productForm.is_active,
            default_price: productForm.default_price ?? 0,
            default_product_status: productForm.default_product_status,
            category_uuid: productForm.category_id,
            image: productForm.image
        }
        if (editingProduct.value) {
            await productService.updateProduct(editingProduct.value.uuid, payload)
            toast.add({ title: 'Product updated', color: 'success' })
        } else {
            await productService.createProduct(payload)
            toast.add({ title: 'Product created', color: 'success' })
        }
        isProductModalOpen.value = false
        await loadProducts()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingProduct.value = false
    }
}

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

function onDeleteProduct(product: Product) {
    askConfirm({
        title: 'Delete product?',
        description: `Delete "${product.name}"?`,
        confirmLabel: 'Delete',
        color: 'error',
        action: async () => {
            await productService.deleteProduct(product.uuid)
            toast.add({ title: 'Product deleted', color: 'success' })
            await loadProducts()
        }
    })
}

const productActionsCache = new Map<string, DropdownMenuItem[]>()

function productActions(product: Product): DropdownMenuItem[] {
    const cached = productActionsCache.get(product.uuid)
    if (cached) return cached

    const actions: DropdownMenuItem[] = [
        { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openProductEditModal(product) },
        { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => onDeleteProduct(product) }
    ]
    productActionsCache.set(product.uuid, actions)
    return actions
}

// ---- Categories ----

const categoriesLoading = ref(false)
const categories = ref<Category[]>([])
const categoriesPage = ref(1)
const categoriesTotal = ref(0)
const categorySearch = ref('')

const categoryColumns: TableColumn<Category>[] = [
    { id: 'category', header: 'Category' },
    { accessorKey: 'is_active', header: 'Status' },
    { id: 'actions', header: '' }
]

async function loadCategories() {
    categoriesLoading.value = true
    try {
        const response = await productCategoryService.fetchCategories({ page: categoriesPage.value, per_page: perPage, search: categorySearch.value || undefined })
        categories.value = response.data.data
        categoriesTotal.value = response.data.total
        categoryActionsCache.clear()
    } catch (error) {
        toast.add({ title: 'Failed to load categories', description: (error as APIError).message, color: 'error' })
    } finally {
        categoriesLoading.value = false
    }
}

watch(categoriesPage, loadCategories)

useSearchDebounce(categorySearch, () => {
    categoriesPage.value = 1
    loadCategories()
})

const isCategoryModalOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryForm = reactive({
    name: '',
    description: '',
    is_active: true
})
const savingCategory = ref(false)

function openCategoryCreateModal() {
    editingCategory.value = null
    categoryForm.name = ''
    categoryForm.description = ''
    categoryForm.is_active = true
    isCategoryModalOpen.value = true
}

function openCategoryEditModal(category: Category) {
    editingCategory.value = category
    categoryForm.name = category.name
    categoryForm.description = category.description ?? ''
    categoryForm.is_active = category.is_active
    isCategoryModalOpen.value = true
}

async function onSaveCategory() {
    savingCategory.value = true
    try {
        const payload = {
            name: categoryForm.name,
            description: categoryForm.description,
            is_active: categoryForm.is_active
        }
        if (editingCategory.value) {
            const response = await productCategoryService.updateCategory(editingCategory.value.uuid, payload)
            const categories = allCategories.value ?? []
            const index = categories.findIndex((category) => category.uuid === response.data.uuid)
            if (index !== -1) categories[index] = response.data
            allCategories.value = categories
            toast.add({ title: 'Category updated', color: 'success' })
        } else {
            const response = await productCategoryService.createCategory(payload)
            allCategories.value = [...(allCategories.value ?? []), response.data]
            toast.add({ title: 'Category created', color: 'success' })
        }
        isCategoryModalOpen.value = false
        await loadCategories()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingCategory.value = false
    }
}

function onDeleteCategory(category: Category) {
    askConfirm({
        title: 'Delete category?',
        description: `Delete "${category.name}"?`,
        confirmLabel: 'Delete',
        color: 'error',
        action: async () => {
            await productCategoryService.deleteCategory(category.uuid)
            allCategories.value = (allCategories.value ?? []).filter((item) => item.uuid !== category.uuid)
            toast.add({ title: 'Category deleted', color: 'success' })
            await loadCategories()
        }
    })
}

function viewCategoryProducts(category: Category) {
    productCategoryFilter.value = category.uuid
    activeTab.value = 'products'
}

const categoryActionsCache = new Map<string, DropdownMenuItem[]>()

function categoryActions(category: Category): DropdownMenuItem[] {
    const cached = categoryActionsCache.get(category.uuid)
    if (cached) return cached

    const actions: DropdownMenuItem[] = [
        { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openCategoryEditModal(category) },
        { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => onDeleteCategory(category) }
    ]
    categoryActionsCache.set(category.uuid, actions)
    return actions
}

onMounted(() => {
    ensureCategoriesLoaded().catch((error) => {
        toast.add({ title: 'Failed to load categories', description: (error as APIError).message, color: 'error' })
    })
    loadProducts()
    loadCategories()
})

onPullToRefresh(() => Promise.all([ensureCategoriesLoaded(true), loadProducts(), loadCategories()]))
</script>
