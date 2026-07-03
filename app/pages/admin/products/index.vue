<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Products</h1>
            <UButton icon="i-lucide-plus" @click="openCreateModal">Add Product</UButton>
        </div>

        <UTable :data="products" :columns="columns" :loading="loading">
            <template #image_url-cell="{ row }">
                <img
                    v-if="row.original.image_url"
                    :src="row.original.image_url"
                    class="size-10 rounded object-cover"
                    alt=""
                >
                <div v-else class="size-10 rounded bg-elevated" />
            </template>
            <template #is_active-cell="{ row }">
                <UBadge :color="row.original.is_active ? 'success' : 'neutral'" variant="subtle">
                    {{ row.original.is_active ? 'Active' : 'Inactive' }}
                </UBadge>
            </template>
            <template #actions-cell="{ row }">
                <div class="flex gap-2">
                    <UButton size="xs" color="neutral" variant="ghost" @click="openEditModal(row.original)">Edit</UButton>
                    <UButton size="xs" color="error" variant="ghost" @click="onDelete(row.original)">Delete</UButton>
                </div>
            </template>
        </UTable>

        <div class="flex justify-center">
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

const columns: TableColumn<Product>[] = [
    { accessorKey: 'image_url', header: '' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'is_active', header: 'Active' },
    { id: 'actions', header: '' }
]

async function loadProducts() {
    loading.value = true
    try {
        const response = await productService.fetchProducts({ page: page.value, per_page: perPage })
        products.value = response.data.data
        total.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load products', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadProducts)

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
