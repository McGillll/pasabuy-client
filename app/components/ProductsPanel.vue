<template>
    <div class="space-y-4">
        <EntityFilterBar
            v-model="search"
            placeholder="Search products…"
            :show-filter-button="true"
            :filter-count="activeFilterCount"
            @filter-click="isMobileFiltersOpen = true"
        >
            <div v-if="categoryFilterTabs.length > 2" data-swipe-ignore>
                <ChipOverflowFilter
                    v-model="categoryFilter"
                    :items="categoryFilterTabs"
                    title="All categories"
                    search-placeholder="Search categories…"
                />
            </div>

            <div class="hidden sm:grid grid-cols-4 gap-2">
                <BaseSelect v-model="statusFilter" :items="statusFilterOptions" placeholder="Status" />
                <BaseSelect v-model="sortByPrice" :items="sortByPriceOptions" placeholder="Sort by price" />
                <BaseInput v-model.number="priceMin" type="number" min="0" step="0.01" placeholder="0" />
                <BaseInput v-model.number="priceMax" type="number" min="0" step="0.01" placeholder="1000" />
            </div>
        </EntityFilterBar>

        <USlideover v-model:open="isMobileFiltersOpen" side="bottom" title="Filters">
            <template #body>
                <div class="space-y-4">
                    <BaseFormField label="Status">
                        <BaseSelect v-model="statusFilter" :items="statusFilterOptions" />
                    </BaseFormField>
                    <BaseFormField label="Sort by price">
                        <BaseSelect v-model="sortByPrice" :items="sortByPriceOptions" />
                    </BaseFormField>
                    <div class="grid grid-cols-2 gap-4">
                        <BaseFormField label="Min price">
                            <BaseInput v-model.number="priceMin" type="number" min="0" step="0.01" placeholder="0.00" />
                        </BaseFormField>
                        <BaseFormField label="Max price">
                            <BaseInput v-model.number="priceMax" type="number" min="0" step="0.01" placeholder="0.00" />
                        </BaseFormField>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center gap-2">
                    <BaseButton class="flex-1" color="neutral" variant="outline" @click="clearFilters">Clear filters</BaseButton>
                    <BaseButton class="flex-1" @click="isMobileFiltersOpen = false">Done</BaseButton>
                </div>
            </template>
        </USlideover>

        <div v-if="isDesktop">
            <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UTable :data="products" :columns="columns" :loading="loading" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                    <template #image-cell="{ row }">
                        <div class="relative w-fit">
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
                            <span
                                v-if="statusIconFor(row.original)"
                                class="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-default"
                                :class="statusIconClassFor(row.original)"
                            >
                                <UIcon :name="statusIconFor(row.original)!" class="size-3" />
                                <span class="sr-only">{{ statusLabelFor(row.original) }}</span>
                            </span>
                        </div>
                    </template>
                    <template #product-cell="{ row }">
                        <p class="font-medium text-highlighted" :class="row.original.is_active ? '' : 'opacity-40'">{{ row.original.name }}</p>
                        <p v-if="row.original.description" class="text-sm text-muted truncate max-w-xs">{{ row.original.description }}</p>
                    </template>
                    <template #category-cell="{ row }">
                        <span class="text-sm text-muted">{{ row.original.category?.name ?? '-' }}</span>
                    </template>
                    <template #default_price-cell="{ row }">
                        <span class="font-medium text-highlighted font-mono tabular-nums">₱{{ row.original.default_price }}</span>
                    </template>
                    <template #status-cell="{ row }">
                        <span class="text-sm text-dimmed">{{ row.original.is_active ? 'Active' : 'Inactive' }}</span>
                    </template>
                    <template #actions-cell="{ row }">
                        <div class="flex justify-end gap-1">
                            <BaseButton icon="i-lucide-pencil" size="sm" color="neutral" variant="ghost" aria-label="Edit product" @click="openEditModal(row.original)" />
                            <BaseButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" aria-label="Delete product" @click="confirmDelete(row.original)" />
                        </div>
                    </template>
                    <template #empty>
                        <BaseEmptyState icon="i-lucide-package-search" message="No products found." action-label="Add your first product" @action="openCreateModal" />
                    </template>
                </UTable>
            </UCard>
        </div>
        <AdminProductList
            v-else
            :items="products"
            :loading="loading"
            :active-category-uuid="categoryFilter"
            @edit="openEditModal"
            @delete="confirmDelete"
        />

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <BaseModal
            v-model:open="isModalOpen"
            :title="editing ? 'Edit Product' : 'Add Product'"
            size="xl"
            show-default-footer
            form-id="product-form"
            :confirm-label="editing ? 'Save' : 'Create'"
            :loading="saving"
        >
            <form id="product-form" class="space-y-6" @submit.prevent="onSave">
                <div class="flex flex-col sm:flex-row gap-6">
                    <div class="sm:w-48 shrink-0 space-y-4">
                        <BaseFormField label="Image">
                            <BaseFileUpload v-model="form.image" accept="image/*">
                                <template #default="{ open }">
                                    <div class="flex items-center gap-3 sm:flex-col sm:items-stretch">
                                        <div class="relative shrink-0 size-24 sm:size-auto sm:w-full sm:aspect-square rounded-lg overflow-hidden ring-1 ring-default bg-elevated cursor-pointer" @click="open()">
                                            <img v-if="imagePreviewUrl" :src="imagePreviewUrl" class="size-full object-cover" alt="">
                                            <div v-else class="flex items-center justify-center size-full text-dimmed">
                                                <UIcon name="i-lucide-image-plus" class="size-6" />
                                            </div>
                                            <BaseButton
                                                v-if="form.image"
                                                icon="i-lucide-x"
                                                size="xs"
                                                color="neutral"
                                                variant="solid"
                                                class="absolute top-1 right-1 rounded-full"
                                                aria-label="Remove selected image"
                                                @click.stop="form.image = null"
                                            />
                                        </div>
                                        <BaseButton :label="imagePreviewUrl ? 'Change photo' : 'Add photo'" color="neutral" variant="outline" size="sm" @click="open()" />
                                    </div>
                                </template>
                            </BaseFileUpload>
                        </BaseFormField>
                        <BaseFormField>
                            <template #label>
                                <span class="inline-flex items-center gap-1">
                                    Active
                                    <BaseHelpTooltip>
                                        Inactive products are hidden from new schedules but stay visible in schedules they were already added to.
                                    </BaseHelpTooltip>
                                </span>
                            </template>
                            <BaseSwitch v-model="form.is_active" label="Product is active" />
                        </BaseFormField>
                    </div>
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <BaseFormField label="Name" required>
                            <BaseInput v-model="form.name" placeholder="Turbo 9inch fan" />
                        </BaseFormField>
                        <BaseFormField required>
                            <template #label>
                                <span class="inline-flex items-center gap-1">
                                    Default price
                                    <BaseHelpTooltip>
                                        This is the base price used when adding this product to a new schedule. It can still be confirmed at a different actual price per schedule without changing this default.
                                    </BaseHelpTooltip>
                                </span>
                            </template>
                            <BaseInput v-model.number="form.default_price" type="number" min="0" step="0.01" placeholder="0.00">
                                <template #leading>
                                    <span class="text-sm text-dimmed">₱</span>
                                </template>
                            </BaseInput>
                        </BaseFormField>
                        <BaseFormField label="Category">
                            <BaseSelectMenu v-model="form.category_id" :items="categoryOptions" class="w-full h-11" />
                        </BaseFormField>
                        <BaseFormField>
                            <template #label>
                                <span class="inline-flex items-center gap-1">
                                    Default product status
                                    <BaseHelpTooltip>
                                        Sets the starting status when this product is added to a new schedule. Each schedule can override it independently, so changing it here only affects schedules created afterward.
                                    </BaseHelpTooltip>
                                </span>
                            </template>
                            <BaseSelect v-model="form.default_product_status" :items="productStatusOptions" />
                        </BaseFormField>
                        <BaseFormField label="Description" class="sm:col-span-2">
                            <BaseTextarea v-model="form.description" placeholder="Short product description" />
                        </BaseFormField>
                    </div>
                </div>
            </form>
        </BaseModal>

        <BaseConfirmModal
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
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'
import type { Category } from '@/types/Category'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
    allCategories: Category[] | null
    focusCategoryUuid?: string | null
}>()

const toast = useToast()
const isDesktop = useIsDesktop()
const perPage = 15

const loading = ref(false)
const products = ref<Product[]>([])
const page = ref(1)
const total = ref(0)
const search = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('all')
const sortByPrice = ref('none')
const priceMin = ref<number | null>(null)
const priceMax = ref<number | null>(null)
const isMobileFiltersOpen = ref(false)

watch(() => props.focusCategoryUuid, (uuid) => {
    if (uuid) categoryFilter.value = uuid
})

const activeFilterCount = computed(() =>
    [statusFilter.value !== 'all', sortByPrice.value !== 'none', priceMin.value !== null, priceMax.value !== null]
        .filter(Boolean).length
)

function clearFilters() {
    statusFilter.value = 'all'
    sortByPrice.value = 'none'
    priceMin.value = null
    priceMax.value = null
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

const productStatusOptions = [
    { label: 'None', value: 'none' },
    { label: 'B1T1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' }
]

const categoryOptions = computed(() => [
    { label: 'Uncategorized', value: null },
    ...(props.allCategories ?? []).map((category) => ({ label: category.name, value: category.uuid }))
])

const categoryFilterTabs = computed(() => [
    { label: 'All', value: 'all' },
    ...(props.allCategories ?? []).map((category) => ({ label: category.name, value: category.uuid }))
])

const columns: TableColumn<Product>[] = [
    { id: 'image', header: '' },
    { id: 'product', header: 'Product' },
    { id: 'category', header: 'Category' },
    { id: 'default_price', header: 'Price' },
    { id: 'status', header: 'Status' },
    { id: 'actions', header: '' }
]

const imageLoadFailed = ref<Record<string, boolean>>({})

function onImageError(uuid: string) {
    imageLoadFailed.value[uuid] = true
}

const { productStatusIcon, productStatusIconClass, productStatusLabel } = useProductStatus()

function statusIconFor(product: Product) {
    if (product.default_product_status === 'none') return undefined
    return productStatusIcon[product.default_product_status]
}

function statusIconClassFor(product: Product) {
    if (product.default_product_status === 'none') return undefined
    return productStatusIconClass[product.default_product_status]
}

function statusLabelFor(product: Product) {
    if (product.default_product_status === 'none') return undefined
    return productStatusLabel[product.default_product_status]
}

async function loadProducts() {
    loading.value = true
    try {
        const response = await productService.fetchProducts({
            page: page.value,
            per_page: perPage,
            search: search.value || undefined,
            category_uuid: categoryFilter.value !== 'all' ? categoryFilter.value : undefined,
            status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
            sort_by_price: sortByPrice.value !== 'none' ? sortByPrice.value : undefined,
            price_min: priceMin.value ?? undefined,
            price_max: priceMax.value ?? undefined
        })
        products.value = response.data.items
        total.value = response.data.total
        imageLoadFailed.value = {}
    } catch (error) {
        toast.add({
            title: 'Failed to load products',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadProducts() }]
        })
    } finally {
        loading.value = false
    }
}

watch(page, loadProducts)

watch([categoryFilter, statusFilter, sortByPrice], () => {
    page.value = 1
    loadProducts()
})

useSearchDebounce(search, () => {
    page.value = 1
    loadProducts()
})

let priceRangeDebounce: ReturnType<typeof setTimeout>
watch([priceMin, priceMax], () => {
    clearTimeout(priceRangeDebounce)
    priceRangeDebounce = setTimeout(() => {
        page.value = 1
        loadProducts()
    }, 300)
})

const isModalOpen = ref(false)
const editing = ref<Product | null>(null)
const form = reactive({
    name: '',
    description: '',
    is_active: true,
    default_price: null as number | null,
    default_product_status: 'none' as 'none' | 'b1t1' | 'out_of_stock',
    category_id: null as string | null,
    image: null as File | null
})
const saving = ref(false)

const imagePreviewUrl = ref<string | null>(null)

watch(
    [() => form.image, () => editing.value],
    ([image, product], _old, onCleanup) => {
        if (image) {
            const url = URL.createObjectURL(image)
            imagePreviewUrl.value = url
            onCleanup(() => URL.revokeObjectURL(url))
            return
        }
        imagePreviewUrl.value = product?.image_url ?? null
    },
    { immediate: true }
)

function openCreateModal() {
    editing.value = null
    form.name = ''
    form.description = ''
    form.is_active = true
    form.default_price = null
    form.default_product_status = 'none'
    form.category_id = null
    form.image = null
    isModalOpen.value = true
}

function openEditModal(product: Product) {
    editing.value = product
    form.name = product.name
    form.description = product.description ?? ''
    form.is_active = product.is_active
    form.default_price = Number(product.default_price)
    form.default_product_status = product.default_product_status
    form.category_id = product.category?.uuid ?? null
    form.image = null
    isModalOpen.value = true
}

async function onSave() {
    saving.value = true
    try {
        const payload = {
            name: form.name,
            description: form.description,
            is_active: form.is_active,
            default_price: form.default_price ?? 0,
            default_product_status: form.default_product_status,
            category_uuid: form.category_id,
            image: form.image
        }
        if (editing.value) {
            await productService.updateProduct(editing.value.uuid, payload)
            toast.add({ title: 'Product updated', color: 'success' })
        } else {
            await productService.createProduct(payload)
            toast.add({ title: 'Product created', color: 'success' })
        }
        isModalOpen.value = false
        await loadProducts()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        saving.value = false
    }
}

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

function confirmDelete(product: Product) {
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

defineExpose({ reload: loadProducts, openCreateModal })

onMounted(loadProducts)
</script>
