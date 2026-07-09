<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Pasabuy Schedules</h1>
            <UButton icon="i-lucide-plus" @click="openCreateModal">New Schedule</UButton>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
            <SearchInput v-model="search" placeholder="Search schedules…" />
            <div class="flex gap-2">
                <USelect
                    v-model="monthFilter"
                    :items="monthFilterOptions"
                    value-key="value"
                    placeholder="All months"
                    class="w-full sm:w-40"
                />
                <USelect
                    v-model="yearFilter"
                    :items="yearFilterOptions"
                    value-key="value"
                    placeholder="All years"
                    class="w-full sm:w-32"
                />
            </div>
        </div>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <div class="hidden sm:block">
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
                        <StatusBadge :color="scheduleStatusColor[row.original.status]" :label="row.original.status" />
                    </template>
                    <template #pasabuy_schedule_date-cell="{ row }">
                        <span class="text-muted">{{ row.original.pasabuy_schedule_date ? formatDate(row.original.pasabuy_schedule_date) : '—' }}</span>
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
                        <TableEmptyState
                            icon="i-lucide-calendar-search"
                            message="No schedules found."
                            action-label="Create your first schedule"
                            @action="openCreateModal"
                        />
                    </template>
                </UTable>
            </div>
            <div class="sm:hidden divide-y divide-default">
                <ListCard
                    v-for="scheduleRow in schedules"
                    :key="scheduleRow.uuid"
                    clickable
                    :tone="scheduleStatusColor[scheduleRow.status]"
                    @click="navigateTo(`/admin/schedules/${scheduleRow.uuid}`)"
                >
                    <template #title>
                        <p class="font-medium text-highlighted">{{ scheduleRow.title }}</p>
                    </template>
                    <template #meta>
                        <StatusBadge :color="scheduleStatusColor[scheduleRow.status]" :label="scheduleRow.status" />
                        <span class="text-muted">{{ scheduleRow.pasabuy_schedule_date ? formatDate(scheduleRow.pasabuy_schedule_date) : '—' }}</span>
                    </template>
                    <template #actions>
                        <UButton
                            v-if="scheduleRow.status === 'open'"
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-lock"
                            aria-label="Close schedule"
                            :loading="closingUuid === scheduleRow.uuid"
                            @click.stop="closeSchedule(scheduleRow)"
                        />
                        <UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed" />
                    </template>
                </ListCard>
                <TableEmptyState
                    v-if="schedules.length === 0"
                    icon="i-lucide-calendar-search"
                    message="No schedules found."
                    action-label="Create your first schedule"
                    @action="openCreateModal"
                />
            </div>
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
                    <UFormField label="Pasabuy date" hint="The date you'll go to the store" required>
                        <UInput v-model="form.pasabuy_schedule_date" type="date" required class="w-full" />
                    </UFormField>
                    <UButton type="submit" block :loading="saving">Create</UButton>
                </form>
            </template>
        </UModal>

        <ConfirmDialogModal
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
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Schedule {
    uuid: string
    title: string
    status: string
    is_open: boolean
    pasabuy_schedule_date: string | null
    created_at: string
}

const toast = useToast()
const schedules = ref<Schedule[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = 15
const total = ref(0)
const search = ref('')
const monthFilter = ref<number | null>(null)
const yearFilter = ref<number | null>(null)

const monthFilterOptions = [
    { label: 'All months', value: null },
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
]

const currentYear = new Date().getFullYear()
const yearFilterOptions = [
    { label: 'All years', value: null },
    ...Array.from({ length: 5 }, (_, index) => currentYear - index).map((year) => ({ label: String(year), value: year }))
]

const columns: TableColumn<Schedule>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'pasabuy_schedule_date', header: 'Pasabuy date' },
    { id: 'actions', header: '' }
]

async function loadSchedules() {
    loading.value = true
    try {
        const response = await pasabuyScheduleService.fetchSchedules({
            page: page.value,
            per_page: perPage,
            search: search.value || undefined,
            month: monthFilter.value || undefined,
            year: yearFilter.value || undefined
        })
        schedules.value = response.data.data
        total.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load schedules', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadSchedules)

watch([monthFilter, yearFilter], () => {
    page.value = 1
    loadSchedules()
})

useSearchDebounce(search, () => {
    page.value = 1
    loadSchedules()
})

const isModalOpen = ref(false)
const form = reactive({ title: '', description: '', pasabuy_schedule_date: '' })
const saving = ref(false)

function openCreateModal() {
    form.title = ''
    form.description = ''
    form.pasabuy_schedule_date = ''
    isModalOpen.value = true
}

async function onCreate() {
    if (!form.pasabuy_schedule_date) {
        toast.add({ title: 'Pasabuy date is required', color: 'error' })
        return
    }

    saving.value = true
    try {
        const response = await pasabuyScheduleService.createSchedule({
            title: form.title,
            description: form.description,
            pasabuy_schedule_date: form.pasabuy_schedule_date
        })
        isModalOpen.value = false
        await navigateTo(`/admin/schedules/${response.data.uuid}`)
    } catch (error) {
        toast.add({ title: 'Create failed', description: (error as APIError).message, color: 'error' })
    } finally {
        saving.value = false
    }
}

const closingUuid = ref<string | null>(null)

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

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
                    pasabuy_schedule_date: detail.data.pasabuy_schedule_date ?? detail.data.created_at.slice(0, 10),
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
