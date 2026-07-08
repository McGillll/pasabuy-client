<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Categories</h1>
            <UButton icon="i-lucide-plus" @click="openCreateModal">Add Category</UButton>
        </div>

        <UInput v-model="search" icon="i-lucide-search" placeholder="Search categories…" class="w-full sm:w-72" />

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <UTable
                :data="categories"
                :columns="columns"
                :loading="loading"
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
                            @click="openEditModal(row.original)"
                        />
                        <UButton
                            icon="i-lucide-trash-2"
                            size="sm"
                            color="error"
                            variant="ghost"
                            aria-label="Delete category"
                            @click="onDelete(row.original)"
                        />
                    </div>
                </template>
                <template #empty>
                    <div class="flex flex-col items-center gap-3 py-10">
                        <UIcon name="i-lucide-tags" class="size-8 text-dimmed" />
                        <p class="text-sm text-muted">No categories found.</p>
                        <UButton size="sm" icon="i-lucide-plus" @click="openCreateModal">Add your first category</UButton>
                    </div>
                </template>
            </UTable>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <UModal v-model:open="isModalOpen" :title="editingCategory ? 'Edit Category' : 'Add Category'">
            <template #body>
                <form class="space-y-4" @submit.prevent="onSave">
                    <UFormField label="Name" required>
                        <UInput v-model="form.name" class="w-full" />
                    </UFormField>
                    <UFormField label="Description">
                        <UTextarea v-model="form.description" class="w-full" />
                    </UFormField>
                    <UFormField label="Active">
                        <UCheckbox v-model="form.is_active" label="Category is active" />
                    </UFormField>
                    <UButton type="submit" block :loading="saving">Save</UButton>
                </form>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { productCategoryService } from '@/components/api/admin/ProductCategoryService'
import APIError from '@/components/api/user/APIError'
import type { Category } from '@/types/Category'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const toast = useToast()
const categories = ref<Category[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = 15
const total = ref(0)
const search = ref('')

const columns: TableColumn<Category>[] = [
    { id: 'category', header: 'Category' },
    { accessorKey: 'is_active', header: 'Status' },
    { id: 'actions', header: '' }
]

async function loadCategories() {
    loading.value = true
    try {
        const response = await productCategoryService.fetchCategories({ page: page.value, per_page: perPage, search: search.value || undefined })
        categories.value = response.data.data
        total.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load categories', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadCategories)

useSearchDebounce(search, () => {
    page.value = 1
    loadCategories()
})

const isModalOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const form = reactive({
    name: '',
    description: '',
    is_active: true
})
const saving = ref(false)

function openCreateModal() {
    editingCategory.value = null
    form.name = ''
    form.description = ''
    form.is_active = true
    isModalOpen.value = true
}

function openEditModal(category: Category) {
    editingCategory.value = category
    form.name = category.name
    form.description = category.description ?? ''
    form.is_active = category.is_active
    isModalOpen.value = true
}

async function onSave() {
    saving.value = true
    try {
        const payload = {
            name: form.name,
            description: form.description,
            is_active: form.is_active
        }
        if (editingCategory.value) {
            await productCategoryService.updateCategory(editingCategory.value.uuid, payload)
            toast.add({ title: 'Category updated', color: 'success' })
        } else {
            await productCategoryService.createCategory(payload)
            toast.add({ title: 'Category created', color: 'success' })
        }
        isModalOpen.value = false
        await loadCategories()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        saving.value = false
    }
}

async function onDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"?`)) return

    try {
        await productCategoryService.deleteCategory(category.uuid)
        toast.add({ title: 'Category deleted', color: 'success' })
        await loadCategories()
    } catch (error) {
        toast.add({ title: 'Delete failed', description: (error as APIError).message, color: 'error' })
    }
}

onMounted(loadCategories)
</script>
