<template>
    <div class="space-y-4">
        <EntityFilterBar v-model="search" placeholder="Search brands…" />

        <div v-if="isDesktop">
            <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <UTable :data="brands" :columns="columns" :loading="loading" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                    <template #logo-cell="{ row }">
                        <img
                            v-if="row.original.logo_url && !logoLoadFailed[row.original.uuid]"
                            :src="row.original.logo_url"
                            loading="lazy"
                            class="size-10 rounded-lg object-contain ring-1 ring-default bg-elevated"
                            alt=""
                            @error="onLogoError(row.original.uuid)"
                        >
                        <div v-else class="flex items-center justify-center size-10 rounded-lg bg-elevated text-dimmed">
                            <UIcon name="i-lucide-tag" class="size-4" />
                        </div>
                    </template>
                    <template #brand-cell="{ row }">
                        <p class="font-medium text-highlighted" :class="row.original.is_active ? '' : 'opacity-40'">{{ row.original.name }}</p>
                    </template>
                    <template #status-cell="{ row }">
                        <span class="text-sm text-dimmed">{{ row.original.is_active ? 'Active' : 'Inactive' }}</span>
                    </template>
                    <template #actions-cell="{ row }">
                        <div class="flex justify-end gap-1">
                            <BaseButton icon="i-lucide-pencil" size="sm" color="neutral" variant="ghost" aria-label="Edit brand" @click="openEditModal(row.original)" />
                            <BaseButton icon="i-lucide-trash-2" size="sm" color="error" variant="ghost" aria-label="Delete brand" @click="confirmDelete(row.original)" />
                        </div>
                    </template>
                    <template #empty>
                        <BaseEmptyState icon="i-lucide-tag" message="No brands found." action-label="Add your first brand" @action="openCreateModal" />
                    </template>
                </UTable>
            </UCard>
        </div>
        <BrandList v-else :items="brands" :loading="loading" @edit="openEditModal" @delete="confirmDelete" />

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <BaseModal
            v-model:open="isModalOpen"
            :title="editing ? 'Edit Brand' : 'Add Brand'"
            show-default-footer
            form-id="brand-form"
            :confirm-label="editing ? 'Save' : 'Create'"
            :loading="saving"
        >
            <form id="brand-form" class="space-y-4" @submit.prevent="onSave">
                <div class="flex items-center gap-3">
                    <img
                        v-if="form.logo_url && !logoPreviewFailed"
                        :src="form.logo_url"
                        class="size-14 shrink-0 rounded-lg object-contain ring-1 ring-default bg-elevated"
                        alt=""
                        @error="logoPreviewFailed = true"
                    >
                    <div v-else class="flex items-center justify-center size-14 shrink-0 rounded-lg bg-elevated text-dimmed">
                        <UIcon name="i-lucide-tag" class="size-5" />
                    </div>
                    <UFormField label="Logo URL" class="flex-1" hint="Optional">
                        <UInput v-model="form.logo_url" placeholder="https://example.com/logo.png" class="w-full" @change="logoPreviewFailed = false" />
                    </UFormField>
                </div>
                <UFormField label="Name" required>
                    <UInput v-model="form.name" placeholder="Nike" class="w-full" />
                </UFormField>
                <UFormField label="Active">
                    <UCheckbox v-model="form.is_active" label="Brand is active" />
                </UFormField>
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
import { brandService } from '@/components/api/admin/BrandService'
import APIError from '@/components/api/user/APIError'
import type { Brand } from '@/types/Brand'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
    allBrands: Brand[] | null
}>()

const emit = defineEmits<{
    'brands-updated': [brands: Brand[]]
}>()

const toast = useToast()
const isDesktop = useIsDesktop()
const perPage = 15

const loading = ref(false)
const brands = ref<Brand[]>([])
const page = ref(1)
const total = ref(0)
const search = ref('')

const columns: TableColumn<Brand>[] = [
    { id: 'logo', header: '' },
    { id: 'brand', header: 'Brand' },
    { id: 'status', header: 'Status' },
    { id: 'actions', header: '' }
]

const logoLoadFailed = ref<Record<string, boolean>>({})

function onLogoError(uuid: string) {
    logoLoadFailed.value[uuid] = true
}

async function loadBrands() {
    loading.value = true
    try {
        const response = await brandService.fetchBrands({ page: page.value, per_page: perPage, search: search.value || undefined })
        brands.value = response.data.items
        total.value = response.data.total
        logoLoadFailed.value = {}
    } catch (error) {
        toast.add({ title: 'Failed to load brands', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadBrands)

useSearchDebounce(search, () => {
    page.value = 1
    loadBrands()
})

const isModalOpen = ref(false)
const editing = ref<Brand | null>(null)
const form = reactive({
    name: '',
    logo_url: '',
    is_active: true
})
const logoPreviewFailed = ref(false)
const saving = ref(false)

function openCreateModal() {
    editing.value = null
    form.name = ''
    form.logo_url = ''
    form.is_active = true
    logoPreviewFailed.value = false
    isModalOpen.value = true
}

function openEditModal(brand: Brand) {
    editing.value = brand
    form.name = brand.name
    form.logo_url = brand.logo_url ?? ''
    form.is_active = brand.is_active
    logoPreviewFailed.value = false
    isModalOpen.value = true
}

async function onSave() {
    saving.value = true
    try {
        const payload = {
            name: form.name,
            logo_url: form.logo_url || null,
            is_active: form.is_active
        }
        if (editing.value) {
            const response = await brandService.updateBrand(editing.value.uuid, payload)
            const list = props.allBrands ?? []
            const index = list.findIndex((brand) => brand.uuid === response.data.uuid)
            if (index !== -1) list[index] = response.data
            emit('brands-updated', list)
            toast.add({ title: 'Brand updated', color: 'success' })
        } else {
            const response = await brandService.createBrand(payload)
            emit('brands-updated', [...(props.allBrands ?? []), response.data])
            toast.add({ title: 'Brand created', color: 'success' })
        }
        isModalOpen.value = false
        await loadBrands()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        saving.value = false
    }
}

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

function confirmDelete(brand: Brand) {
    askConfirm({
        title: 'Delete brand?',
        description: `Delete "${brand.name}"?`,
        confirmLabel: 'Delete',
        color: 'error',
        action: async () => {
            await brandService.deleteBrand(brand.uuid)
            emit('brands-updated', (props.allBrands ?? []).filter((item) => item.uuid !== brand.uuid))
            toast.add({ title: 'Brand deleted', color: 'success' })
            await loadBrands()
        }
    })
}

defineExpose({ reload: loadBrands, openCreateModal })

onMounted(loadBrands)
</script>
