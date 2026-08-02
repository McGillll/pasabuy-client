<template>
    <div class="space-y-4">
        <EntityFilterBar v-model="search" placeholder="Search categories…" />

        <div v-if="isDesktop">
            <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UTable :data="categories" :columns="columns" :loading="loading" :ui="{ tr: 'hover:bg-elevated/50 transition-colors cursor-pointer' }" @select="(_event: Event, row: { original: Category }) => viewProducts(row.original)">
                    <template #image-cell="{ row }">
                        <img
                            v-if="row.original.image_url && !imageLoadFailed[row.original.uuid]"
                            :src="row.original.image_url"
                            loading="lazy"
                            class="size-10 rounded-lg object-cover ring-1 ring-default bg-elevated"
                            alt=""
                            @error="onImageError(row.original.uuid)"
                        >
                        <div v-else class="flex items-center justify-center size-10 rounded-lg bg-elevated text-dimmed">
                            <UIcon name="i-lucide-tag" class="size-4" />
                        </div>
                    </template>
                    <template #category-cell="{ row }">
                        <p class="font-medium text-highlighted" :class="row.original.is_active ? '' : 'opacity-40'">{{ row.original.name }}</p>
                        <p v-if="row.original.description" class="text-sm text-muted truncate max-w-xs">{{ row.original.description }}</p>
                    </template>
                    <template #status-cell="{ row }">
                        <span class="text-sm text-dimmed">{{ row.original.is_active ? 'Active' : 'Inactive' }}</span>
                    </template>
                    <template #actions-cell="{ row }">
                        <div class="flex justify-end gap-1">
                            <BaseButton icon="i-lucide-pencil" size="sm" color="neutral" variant="ghost" aria-label="Edit category" @click.stop="openEditModal(row.original)" />
                            <BaseButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" aria-label="Delete category" @click.stop="confirmDelete(row.original)" />
                        </div>
                    </template>
                    <template #empty>
                        <BaseEmptyState icon="i-lucide-tags" message="No categories found." action-label="Add your first category" @action="openCreateModal" />
                    </template>
                </UTable>
            </UCard>
        </div>
        <CategoryList v-else :items="categories" :loading="loading" @view="viewProducts" @edit="openEditModal" @delete="confirmDelete" />

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <BaseModal
            v-model:open="isModalOpen"
            :title="editing ? 'Edit Category' : 'Add Category'"
            show-default-footer
            form-id="category-form"
            :confirm-label="editing ? 'Save' : 'Create'"
            :loading="saving"
        >
            <form id="category-form" class="space-y-4" @submit.prevent="onSave">
                <div class="flex items-center gap-3">
                    <img
                        v-if="form.image_url && !imagePreviewFailed"
                        :src="form.image_url"
                        class="size-14 shrink-0 rounded-lg object-cover ring-1 ring-default bg-elevated"
                        alt=""
                        @error="imagePreviewFailed = true"
                    >
                    <div v-else class="flex items-center justify-center size-14 shrink-0 rounded-lg bg-elevated text-dimmed">
                        <UIcon name="i-lucide-tag" class="size-5" />
                    </div>
                    <BaseFormField label="Image URL" class="flex-1" hint="Optional">
                        <BaseInput v-model="form.image_url" placeholder="https://example.com/image.jpg" @change="imagePreviewFailed = false" />
                    </BaseFormField>
                </div>
                <BaseFormField label="Name" required>
                    <BaseInput v-model="form.name" placeholder="Appliances" />
                </BaseFormField>
                <BaseFormField label="Description">
                    <BaseTextarea v-model="form.description" placeholder="Short category description" />
                </BaseFormField>
                <BaseFormField label="Active">
                    <BaseCheckbox v-model="form.is_active" label="Category is active" />
                </BaseFormField>
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
import { productCategoryService } from '@/components/api/admin/ProductCategoryService'
import APIError from '@/components/api/user/APIError'
import type { Category } from '@/types/Category'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
    allCategories: Category[] | null
}>()

const emit = defineEmits<{
    'categories-updated': [categories: Category[]]
    'view-products': [category: Category]
}>()

const toast = useToast()
const isDesktop = useIsDesktop()
const perPage = 15

const loading = ref(false)
const categories = ref<Category[]>([])
const page = ref(1)
const total = ref(0)
const search = ref('')

const columns: TableColumn<Category>[] = [
    { id: 'image', header: '' },
    { id: 'category', header: 'Category' },
    { id: 'status', header: 'Status' },
    { id: 'actions', header: '' }
]

const imageLoadFailed = ref<Record<string, boolean>>({})

function onImageError(uuid: string) {
    imageLoadFailed.value[uuid] = true
}

async function loadCategories() {
    loading.value = true
    try {
        const response = await productCategoryService.fetchCategories({ page: page.value, per_page: perPage, search: search.value || undefined })
        categories.value = response.data.items
        total.value = response.data.total
        imageLoadFailed.value = {}
    } catch (error) {
        toast.add({
            title: 'Failed to load categories',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadCategories() }]
        })
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
const editing = ref<Category | null>(null)
const form = reactive({
    name: '',
    description: '',
    image_url: '',
    is_active: true
})
const imagePreviewFailed = ref(false)
const saving = ref(false)

function openCreateModal() {
    editing.value = null
    form.name = ''
    form.description = ''
    form.image_url = ''
    form.is_active = true
    imagePreviewFailed.value = false
    isModalOpen.value = true
}

function openEditModal(category: Category) {
    editing.value = category
    form.name = category.name
    form.description = category.description ?? ''
    form.image_url = category.image_url ?? ''
    form.is_active = category.is_active
    imagePreviewFailed.value = false
    isModalOpen.value = true
}

async function onSave() {
    saving.value = true
    try {
        const payload = {
            name: form.name,
            description: form.description,
            image_url: form.image_url || null,
            is_active: form.is_active
        }
        if (editing.value) {
            const response = await productCategoryService.updateCategory(editing.value.uuid, payload)
            const list = props.allCategories ?? []
            const index = list.findIndex((category) => category.uuid === response.data.uuid)
            if (index !== -1) list[index] = response.data
            emit('categories-updated', list)
            toast.add({ title: 'Category updated', color: 'success' })
        } else {
            const response = await productCategoryService.createCategory(payload)
            emit('categories-updated', [...(props.allCategories ?? []), response.data])
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

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

function confirmDelete(category: Category) {
    askConfirm({
        title: 'Delete category?',
        description: `Delete "${category.name}"?`,
        confirmLabel: 'Delete',
        color: 'error',
        action: async () => {
            await productCategoryService.deleteCategory(category.uuid)
            emit('categories-updated', (props.allCategories ?? []).filter((item) => item.uuid !== category.uuid))
            toast.add({ title: 'Category deleted', color: 'success' })
            await loadCategories()
        }
    })
}

function viewProducts(category: Category) {
    emit('view-products', category)
}

defineExpose({ reload: loadCategories, openCreateModal })

onMounted(loadCategories)
</script>
