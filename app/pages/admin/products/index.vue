<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Products</h1>
            <UButton v-if="activeTab === 'products'" icon="i-lucide-plus" @click="openProductCreateModal">Add Product</UButton>
            <UButton v-else icon="i-lucide-plus" @click="openCategoryCreateModal">Add Category</UButton>
        </div>

        <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #products>
                <div class="mt-4 space-y-4">
                    <div class="flex flex-col sm:flex-row gap-2">
                        <UInput v-model="productSearch" icon="i-lucide-search" placeholder="Search products…" class="w-full sm:w-72" />
                        <USelect
                            v-model="productCategoryFilter"
                            :items="categoryFilterOptions"
                            value-key="value"
                            placeholder="All categories"
                            class="w-full sm:w-56"
                        />
                    </div>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <UTable
                            :data="products"
                            :columns="productColumns"
                            :loading="productsLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                        >
                            <template #image-cell="{ row }">
                                <img
                                    v-if="row.original.image_url"
                                    :src="row.original.image_url"
                                    class="size-12 rounded-lg object-cover ring-1 ring-default"
                                    alt=""
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
                                <span class="text-sm text-muted">{{ row.original.category?.name ?? '—' }}</span>
                            </template>
                            <template #default_price-cell="{ row }">
                                <span class="font-medium text-highlighted">₱{{ row.original.default_price }}</span>
                            </template>
                            <template #is_active-cell="{ row }">
                                <UBadge :color="row.original.is_active ? 'success' : 'neutral'" variant="subtle">
                                    <span class="flex items-center gap-1.5">
                                        <span class="size-1.5 rounded-full bg-current" />
                                        {{ row.original.is_active ? 'Active' : 'Inactive' }}
                                    </span>
                                </UBadge>
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end gap-1">
                                    <UButton
                                        icon="i-lucide-pencil"
                                        size="sm"
                                        color="neutral"
                                        variant="ghost"
                                        aria-label="Edit product"
                                        @click="openProductEditModal(row.original)"
                                    />
                                    <UButton
                                        icon="i-lucide-trash-2"
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Delete product"
                                        @click="onDeleteProduct(row.original)"
                                    />
                                </div>
                            </template>
                            <template #empty>
                                <div class="flex flex-col items-center gap-3 py-10">
                                    <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                                    <p class="text-sm text-muted">No products found.</p>
                                    <UButton size="sm" icon="i-lucide-plus" @click="openProductCreateModal">Add your first product</UButton>
                                </div>
                            </template>
                        </UTable>
                    </UCard>

                    <div v-if="productsTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="productsPage" :total="productsTotal" :items-per-page="perPage" />
                    </div>
                </div>
            </template>

            <template #categories>
                <div class="mt-4 space-y-4">
                    <UInput v-model="categorySearch" icon="i-lucide-search" placeholder="Search categories…" class="w-full sm:w-72" />

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <UTable
                            :data="categories"
                            :columns="categoryColumns"
                            :loading="categoriesLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                        >
                            <template #category-cell="{ row }">
                                <p class="font-medium text-highlighted">{{ row.original.name }}</p>
                                <p v-if="row.original.description" class="text-sm text-muted truncate max-w-xs">
                                    {{ row.original.description }}
                                </p>
                            </template>
                            <template #is_active-cell="{ row }">
                                <UBadge :color="row.original.is_active ? 'success' : 'neutral'" variant="subtle">
                                    <span class="flex items-center gap-1.5">
                                        <span class="size-1.5 rounded-full bg-current" />
                                        {{ row.original.is_active ? 'Active' : 'Inactive' }}
                                    </span>
                                </UBadge>
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end gap-1">
                                    <UButton
                                        icon="i-lucide-pencil"
                                        size="sm"
                                        color="neutral"
                                        variant="ghost"
                                        aria-label="Edit category"
                                        @click="openCategoryEditModal(row.original)"
                                    />
                                    <UButton
                                        icon="i-lucide-trash-2"
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Delete category"
                                        @click="onDeleteCategory(row.original)"
                                    />
                                </div>
                            </template>
                            <template #empty>
                                <div class="flex flex-col items-center gap-3 py-10">
                                    <UIcon name="i-lucide-tags" class="size-8 text-dimmed" />
                                    <p class="text-sm text-muted">No categories found.</p>
                                    <UButton size="sm" icon="i-lucide-plus" @click="openCategoryCreateModal">Add your first category</UButton>
                                </div>
                            </template>
                        </UTable>
                    </UCard>

                    <div v-if="categoriesTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="categoriesPage" :total="categoriesTotal" :items-per-page="perPage" />
                    </div>
                </div>
            </template>
        </UTabs>

        <UModal v-model:open="isProductModalOpen" :title="editingProduct ? 'Edit Product' : 'Add Product'">
            <template #body>
                <form class="space-y-4" @submit.prevent="onSaveProduct">
                    <UFormField label="Name" required>
                        <UInput v-model="productForm.name" class="w-full" />
                    </UFormField>
                    <UFormField label="Description">
                        <UTextarea v-model="productForm.description" class="w-full" />
                    </UFormField>
                    <UFormField label="Default price" required>
                        <UInput v-model.number="productForm.default_price" type="number" min="0" step="0.01" class="w-full">
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
                    <UFormField label="Image">
                        <UFileUpload v-model="productForm.image" accept="image/*" />
                    </UFormField>
                    <UFormField label="Active">
                        <UCheckbox v-model="productForm.is_active" label="Product is active" />
                    </UFormField>
                    <UButton type="submit" block :loading="savingProduct">Save</UButton>
                </form>
            </template>
        </UModal>

        <UModal v-model:open="isCategoryModalOpen" :title="editingCategory ? 'Edit Category' : 'Add Category'">
            <template #body>
                <form class="space-y-4" @submit.prevent="onSaveCategory">
                    <UFormField label="Name" required>
                        <UInput v-model="categoryForm.name" class="w-full" />
                    </UFormField>
                    <UFormField label="Description">
                        <UTextarea v-model="categoryForm.description" class="w-full" />
                    </UFormField>
                    <UFormField label="Active">
                        <UCheckbox v-model="categoryForm.is_active" label="Category is active" />
                    </UFormField>
                    <UButton type="submit" block :loading="savingCategory">Save</UButton>
                </form>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { productService } from '@/components/api/admin/ProductService'
import { productCategoryService } from '@/components/api/admin/ProductCategoryService'
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'
import type { Category } from '@/types/Category'
import type { TableColumn, TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const toast = useToast()
const perPage = 15

const activeTab = ref<'products' | 'categories'>('products')

const tabs = computed<TabsItem[]>(() => [
    { label: 'Products', icon: 'i-lucide-package', value: 'products', slot: 'products' },
    { label: 'Categories', icon: 'i-lucide-tags', value: 'categories', slot: 'categories' }
])

// ---- Products ----

const products = ref<Product[]>([])
const allCategories = ref<Category[]>([])
const productsLoading = ref(false)
const productsPage = ref(1)
const productsTotal = ref(0)
const productSearch = ref('')
const productCategoryFilter = ref<string | null>(null)

const categoryOptions = computed(() => [
    { label: 'Uncategorized', value: null },
    ...allCategories.value.map((category) => ({ label: category.name, value: category.uuid }))
])

const categoryFilterOptions = computed(() => [
    { label: 'All categories', value: null },
    ...allCategories.value.map((category) => ({ label: category.name, value: category.uuid }))
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

async function loadCategoryOptions() {
    try {
        const response = await productCategoryService.fetchCategories({ per_page: 200 })
        allCategories.value = response.data.data
    } catch (error) {
        toast.add({ title: 'Failed to load categories', description: (error as APIError).message, color: 'error' })
    }
}

async function loadProducts() {
    productsLoading.value = true
    try {
        const response = await productService.fetchProducts({
            page: productsPage.value,
            per_page: perPage,
            search: productSearch.value || undefined,
            category_uuid: productCategoryFilter.value || undefined
        })
        products.value = response.data.data
        productsTotal.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load products', description: (error as APIError).message, color: 'error' })
    } finally {
        productsLoading.value = false
    }
}

watch(productsPage, loadProducts)

watch(productCategoryFilter, () => {
    productsPage.value = 1
    loadProducts()
})

useSearchDebounce(productSearch, () => {
    productsPage.value = 1
    loadProducts()
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

async function onDeleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return

    try {
        await productService.deleteProduct(product.uuid)
        toast.add({ title: 'Product deleted', color: 'success' })
        await loadProducts()
    } catch (error) {
        toast.add({ title: 'Delete failed', description: (error as APIError).message, color: 'error' })
    }
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
            await productCategoryService.updateCategory(editingCategory.value.uuid, payload)
            toast.add({ title: 'Category updated', color: 'success' })
        } else {
            await productCategoryService.createCategory(payload)
            toast.add({ title: 'Category created', color: 'success' })
        }
        isCategoryModalOpen.value = false
        await loadCategories()
        await loadCategoryOptions()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingCategory.value = false
    }
}

async function onDeleteCategory(category: Category) {
    if (!confirm(`Delete "${category.name}"?`)) return

    try {
        await productCategoryService.deleteCategory(category.uuid)
        toast.add({ title: 'Category deleted', color: 'success' })
        await loadCategories()
        await loadCategoryOptions()
    } catch (error) {
        toast.add({ title: 'Delete failed', description: (error as APIError).message, color: 'error' })
    }
}

onMounted(() => {
    loadCategoryOptions()
    loadProducts()
    loadCategories()
})
</script>
