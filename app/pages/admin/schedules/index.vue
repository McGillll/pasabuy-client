<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Pasabuy Schedules</h1>
            <UButton icon="i-lucide-plus" @click="openCreateModal">New Schedule</UButton>
        </div>

        <UInput v-model="search" icon="i-lucide-search" placeholder="Search schedules…" class="w-full sm:w-72" />

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <UTable
                :data="schedules"
                :columns="columns"
                :loading="loading"
                :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
            >
                <template #title-cell="{ row }">
                    <NuxtLink :to="`/admin/schedules/${row.original.uuid}`" class="font-medium text-highlighted hover:text-primary">
                        {{ row.original.title }}
                    </NuxtLink>
                </template>
                <template #status-cell="{ row }">
                    <UBadge :color="statusColor[row.original.status]" variant="subtle">
                        <span class="flex items-center gap-1.5">
                            <span class="size-1.5 rounded-full bg-current" />
                            {{ row.original.status }}
                        </span>
                    </UBadge>
                </template>
                <template #created_at-cell="{ row }">
                    <span class="text-muted">{{ formatDate(row.original.created_at) }}</span>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-2">
                        <UButton
                            v-if="row.original.status === 'open'"
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-lock"
                            :loading="closingUuid === row.original.uuid"
                            @click="closeSchedule(row.original)"
                        >
                            Close
                        </UButton>
                        <UButton
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            trailing-icon="i-lucide-arrow-right"
                            :to="`/admin/schedules/${row.original.uuid}`"
                        >
                            Manage
                        </UButton>
                    </div>
                </template>
                <template #empty>
                    <div class="flex flex-col items-center gap-3 py-10">
                        <UIcon name="i-lucide-calendar-search" class="size-8 text-dimmed" />
                        <p class="text-sm text-muted">No schedules found.</p>
                        <UButton size="sm" icon="i-lucide-plus" @click="openCreateModal">Create your first schedule</UButton>
                    </div>
                </template>
            </UTable>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
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

        <UModal v-model:open="confirmDialog.open" :title="confirmDialog.title">
            <template #body>
                <p class="text-sm text-muted">{{ confirmDialog.description }}</p>
                <div class="mt-4 flex justify-end gap-2">
                    <UButton color="neutral" variant="soft" @click="confirmDialog.open = false">
                        Cancel
                    </UButton>
                    <UButton :color="confirmDialog.color" :loading="closingUuid !== null" @click="confirmDialogAccept">
                        {{ confirmDialog.confirmLabel }}
                    </UButton>
                </div>
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

useSearchDebounce(search, () => {
    page.value = 1
    loadSchedules()
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

const statusColor: Record<string, 'neutral' | 'success' | 'warning'> = {
    open: 'success',
    closed: 'warning',
    finished: 'neutral'
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const closingUuid = ref<string | null>(null)

const confirmDialog = reactive({
    open: false,
    title: '',
    description: '',
    color: 'primary' as 'primary' | 'success' | 'error',
    confirmLabel: 'Confirm',
    action: null as (() => Promise<void>) | null
})

function askConfirm(options: { title: string, description: string, color?: 'primary' | 'success' | 'error', confirmLabel?: string, action: () => Promise<void> }) {
    confirmDialog.title = options.title
    confirmDialog.description = options.description
    confirmDialog.color = options.color ?? 'primary'
    confirmDialog.confirmLabel = options.confirmLabel ?? 'Confirm'
    confirmDialog.action = options.action
    confirmDialog.open = true
}

async function confirmDialogAccept() {
    const action = confirmDialog.action
    if (!action) return
    await action()
    confirmDialog.open = false
}

function closeSchedule(scheduleRow: Schedule) {
    askConfirm({
        title: 'Close schedule?',
        description: `Close "${scheduleRow.title}"? It can no longer be edited while closed.`,
        confirmLabel: 'Close schedule',
        color: 'primary',
        action: async () => {
            closingUuid.value = scheduleRow.uuid
            try {
                const detail = await pasabuyScheduleService.fetchSchedule(scheduleRow.uuid)
                await pasabuyScheduleService.updateSchedule(scheduleRow.uuid, {
                    title: detail.data.title,
                    description: detail.data.description,
                    cutoff_at: detail.data.cutoff_at,
                    status: 'closed'
                })
                scheduleRow.status = 'closed'
                toast.add({ title: 'Schedule closed', color: 'success' })
            } catch (error) {
                toast.add({ title: 'Failed to close schedule', description: (error as APIError).message, color: 'error' })
            } finally {
                closingUuid.value = null
            }
        }
    })
}

onMounted(loadSchedules)
</script>
