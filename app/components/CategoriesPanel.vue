<template>
    <div class="space-y-4">
        <UBreadcrumb v-if="currentParent" :items="breadcrumbItems">
            <template #item="{ item, index }">
                <button
                    v-if="index < breadcrumbItems.length - 1"
                    type="button"
                    class="text-sm text-muted hover:text-primary transition-colors"
                    @click="goToBreadcrumb(index)"
                >{{ item.label }}</button>
                <span v-else class="text-sm font-semibold text-highlighted">{{ item.label }}</span>
            </template>
        </UBreadcrumb>

        <EntityFilterBar v-model="search" placeholder="Search categories…" />

        <div v-if="isDesktop">
            <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UTable :data="categories" :columns="columns" :loading="loading" :ui="{ tr: 'hover:bg-elevated/50 transition-colors cursor-pointer' }" @select="(_event: Event, row: { original: Category }) => onRowSelect(row.original)">
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
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-dimmed">{{ row.original.is_active ? 'Active' : 'Inactive' }}</span>
                            <UIcon v-if="row.original.has_children" name="i-lucide-corner-down-right" class="size-3.5 text-dimmed" title="Has subcategories" />
                        </div>
                    </template>
                    <template #actions-cell="{ row }">
                        <div class="flex justify-end items-center gap-1">
                            <BaseButton icon="i-lucide-pencil" size="sm" color="neutral" variant="ghost" aria-label="Edit category" @click.stop="openEditModal(row.original)" />
                            <BaseButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" aria-label="Delete category" @click.stop="confirmDelete(row.original)" />
                            <UIcon v-if="row.original.has_children" name="i-lucide-chevron-right" class="size-4 text-dimmed" />
                        </div>
                    </template>
                    <template #empty>
                        <BaseEmptyState icon="i-lucide-tags" :message="emptyMessage" :action-label="emptyActionLabel" @action="openCreateModal" />
                    </template>
                </UTable>
            </UCard>
        </div>
        <CategoryList v-else :items="categories" :loading="loading" :empty-message="emptyMessage" @view="viewProducts" @drill="drillInto" @edit="openEditModal" @delete="confirmDelete" />

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
                <BaseFormField label="Parent category" hint="Optional">
                    <BaseSelectMenu v-model="form.parent_uuid" :items="parentOptions" placeholder="None (top-level)" />
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
    'categories-updated': []
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

const currentParent = ref<Category | null>(null)

const breadcrumbItems = computed(() => currentParent.value
    ? [{ label: 'All categories' }, { label: currentParent.value.name }]
    : [])

const emptyMessage = computed(() => currentParent.value ? 'No subcategories yet.' : 'No categories found.')
const emptyActionLabel = computed(() => currentParent.value ? 'Add subcategory' : 'Add your first category')

const parentOptions = computed(() => [
    { label: 'None (top-level)', value: null },
    ...(props.allCategories ?? [])
        .filter((category) => category.uuid !== editing.value?.uuid)
        .map((category) => ({ label: category.name, value: category.uuid }))
])

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
        const response = await productCategoryService.fetchCategories({
            page: page.value,
            per_page: perPage,
            search: search.value || undefined,
            parent_uuid: currentParent.value?.uuid
        })
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

function drillInto(category: Category) {
    if (!category.has_children) return
    currentParent.value = category
    page.value = 1
    search.value = ''
    loadCategories()
}

function goToBreadcrumb(index: number) {
    if (index !== 0) return
    currentParent.value = null
    page.value = 1
    search.value = ''
    loadCategories()
}

function onRowSelect(category: Category) {
    if (category.has_children) drillInto(category)
    else viewProducts(category)
}

const isModalOpen = ref(false)
const editing = ref<Category | null>(null)
const form = reactive({
    name: '',
    description: '',
    image_url: '',
    is_active: true,
    parent_uuid: null as string | null
})
const imagePreviewFailed = ref(false)
const saving = ref(false)

function openCreateModal() {
    editing.value = null
    form.name = ''
    form.description = ''
    form.image_url = ''
    form.is_active = true
    form.parent_uuid = currentParent.value?.uuid ?? null
    imagePreviewFailed.value = false
    isModalOpen.value = true
}

function openEditModal(category: Category) {
    editing.value = category
    form.name = category.name
    form.description = category.description ?? ''
    form.image_url = category.image_url ?? ''
    form.is_active = category.is_active
    form.parent_uuid = category.parent_uuid
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
            is_active: form.is_active,
            parent_uuid: form.parent_uuid
        }
        if (editing.value) {
            await productCategoryService.updateCategory(editing.value.uuid, payload)
            toast.add({ title: 'Category updated', color: 'success' })
        } else {
            await productCategoryService.createCategory(payload)
            toast.add({ title: 'Category created', color: 'success' })
        }
        isModalOpen.value = false
        emit('categories-updated')
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
            emit('categories-updated')
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
