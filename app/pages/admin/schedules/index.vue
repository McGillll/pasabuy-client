<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Pasabuy Schedules</h1>
            <UButton icon="i-lucide-plus" @click="openCreateModal">New Schedule</UButton>
        </div>

        <UInput v-model="search" icon="i-lucide-search" placeholder="Search schedules…" class="w-full sm:w-72" />

        <UTable :data="schedules" :columns="columns" :loading="loading">
            <template #status-cell="{ row }">
                <UBadge :color="statusColor[row.original.status]" variant="subtle">{{ row.original.status }}</UBadge>
            </template>
            <template #actions-cell="{ row }">
                <UButton size="xs" color="neutral" variant="ghost" :to="`/admin/schedules/${row.original.uuid}`">
                    Manage
                </UButton>
            </template>
        </UTable>

        <div class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <UModal v-model:open="isModalOpen" title="New Pasabuy Schedule">
            <template #body>
                <form class="space-y-4" @submit.prevent="onCreate">
                    <UFormField label="Title" required>
                        <UInput v-model="form.title" class="w-full" />
                    </UFormField>
                    <UFormField label="Description">
                        <UTextarea v-model="form.description" class="w-full" />
                    </UFormField>
                    <UButton type="submit" block :loading="saving">Create</UButton>
                </form>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Schedule {
    uuid: string
    title: string
    status: string
    is_open: boolean
    created_at: string
}

const toast = useToast()
const schedules = ref<Schedule[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = 15
const total = ref(0)
const search = ref('')

const columns: TableColumn<Schedule>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'created_at', header: 'Created' },
    { id: 'actions', header: '' }
]

async function loadSchedules() {
    loading.value = true
    try {
        const response = await pasabuyScheduleService.fetchSchedules({ page: page.value, per_page: perPage, search: search.value || undefined })
        schedules.value = response.data.data
        total.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load schedules', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadSchedules)

let searchDebounce: ReturnType<typeof setTimeout>
watch(search, () => {
    clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
        page.value = 1
        loadSchedules()
    }, 300)
})

const isModalOpen = ref(false)
const form = reactive({ title: '', description: '' })
const saving = ref(false)

function openCreateModal() {
    form.title = ''
    form.description = ''
    isModalOpen.value = true
}

async function onCreate() {
    saving.value = true
    try {
        const response = await pasabuyScheduleService.createSchedule({ title: form.title, description: form.description })
        isModalOpen.value = false
        await navigateTo(`/admin/schedules/${response.data.uuid}`)
    } catch (error) {
        toast.add({ title: 'Create failed', description: (error as APIError).message, color: 'error' })
    } finally {
        saving.value = false
    }
}

const statusColor: Record<string, 'neutral' | 'success' | 'error'> = {
    draft: 'neutral',
    open: 'success',
    closed: 'error'
}

onMounted(loadSchedules)
</script>
