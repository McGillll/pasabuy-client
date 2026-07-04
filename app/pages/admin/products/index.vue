<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Products</h1>
            <UButton icon="i-lucide-plus" @click="openCreateModal">Add Product</UButton>
        </div>

        <UInput v-model="search" icon="i-lucide-search" placeholder="Search products…" class="w-full sm:w-72" />

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <UTable
                :data="products"
                :columns="columns"
                :loading="loading"
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
                            @click="openEditModal(row.original)"
                        />
                        <UButton
                            icon="i-lucide-trash-2"
                            size="sm"
                            color="error"
                            variant="ghost"
                            aria-label="Delete product"
                            @click="onDelete(row.original)"
                        />
                    </div>
                </template>
                <template #empty>
                    <div class="flex flex-col items-center gap-3 py-10">
                        <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                        <p class="text-sm text-muted">No products found.</p>
                        <UButton size="sm" icon="i-lucide-plus" @click="openCreateModal">Add your first product</UButton>
                    </div>
                </template>
            </UTable>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <UModal v-model:open="isModalOpen" :title="editingProduct ? 'Edit Product' : 'Add Product'">
            <template #body>
                <form class="space-y-4" @submit.prevent="onSave">
                    <UFormField label="Name" required>
                        <UInput v-model="form.name" class="w-full" />
                    </UFormField>
                    <UFormField label="Description">
                        <UTextarea v-model="form.description" class="w-full" />
                    </UFormField>
                    <UFormField label="Image">
                        <UFileUpload v-model="form.image" accept="image/*" />
                    </UFormField>
                    <UFormField label="Active">
                        <UCheckbox v-model="form.is_active" label="Product is active" />
                    </UFormField>
                    <UButton type="submit" block :loading="saving">Save</UButton>
                </form>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { productService } from '@/components/api/admin/ProductService'
import APIError from '@/components/api/user/APIError'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Product {
    uuid: string
    name: string
    description: string | null
    image_url: string | null
    is_active: boolean
}

const toast = useToast()
const products = ref<Product[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = 15
const total = ref(0)
const search = ref('')

const columns: TableColumn<Product>[] = [
    { id: 'image', header: '' },
    { id: 'product', header: 'Product' },
    { accessorKey: 'is_active', header: 'Status' },
    { id: 'actions', header: '' }
]

async function loadProducts() {
    loading.value = true
    try {
        const response = await productService.fetchProducts({ page: page.value, per_page: perPage, search: search.value || undefined })
        products.value = response.data.data
        total.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load products', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadProducts)

let searchDebounce: ReturnType<typeof setTimeout>
watch(search, () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
        page.value = 1
        loadProducts()
    }, 300)
})

const isModalOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const form = reactive({
    name: '',
    description: '',
    is_active: true,
    image: null as File | null
})
const saving = ref(false)

function openCreateModal() {
    editingProduct.value = null
    form.name = ''
    form.description = ''
    form.is_active = true
    form.image = null
    isModalOpen.value = true
}

function openEditModal(product: Product) {
    editingProduct.value = product
    form.name = product.name
    form.description = product.description ?? ''
    form.is_active = product.is_active
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
            image: form.image
        }
        if (editingProduct.value) {
            await productService.updateProduct(editingProduct.value.uuid, payload)
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

async function onDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return

    try {
        await productService.deleteProduct(product.uuid)
        toast.add({ title: 'Product deleted', color: 'success' })
        await loadProducts()
    } catch (error) {
        toast.add({ title: 'Delete failed', description: (error as APIError).message, color: 'error' })
    }
}

onMounted(loadProducts)
</script>
