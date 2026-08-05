<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
                <h1 class="text-xl font-semibold text-highlighted">Pasabuy Schedules</h1>
                <BaseHelpTooltip>
                    <span class="font-medium text-highlighted">Open:</span> customers can submit orders; you can still edit schedule details and products.
                    <br><span class="font-medium text-highlighted">Closed:</span> ordering stops and details are locked, but you can confirm actual prices, edit order items, and still reopen it.
                    <br><span class="font-medium text-highlighted">Finished:</span> final state, prices are locked in and order items can no longer be edited.
                </BaseHelpTooltip>
            </div>
            <BaseButton icon="i-lucide-plus" class="hidden sm:inline-flex" @click="isCreateModalOpen = true">New Schedule</BaseButton>
        </div>

        <FabButton aria-label="New schedule" @click="isCreateModalOpen = true" />

        <EntityFilterBar
            v-model="search"
            placeholder="Search schedules…"
            :show-filter-button="true"
            :filter-count="activeFilterCount"
            @filter-click="isFiltersOpen = true"
        >
            <div class="hidden sm:grid grid-cols-3 gap-2">
                <BaseSelect v-model="monthFilter" :items="monthFilterOptions" placeholder="All months" />
                <BaseSelect v-model="yearFilter" :items="yearFilterOptions" placeholder="All years" />
                <BaseSelect v-model="statusFilter" :items="statusFilterOptions" placeholder="All statuses" />
            </div>
        </EntityFilterBar>

        <USlideover v-model:open="isFiltersOpen" side="bottom" title="Filters">
            <template #body>
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <BaseFormField label="Month">
                            <BaseSelect v-model="monthFilter" :items="monthFilterOptions" value-key="value" placeholder="All months" />
                        </BaseFormField>
                        <BaseFormField label="Year">
                            <BaseSelect v-model="yearFilter" :items="yearFilterOptions" value-key="value" placeholder="All years" />
                        </BaseFormField>
                    </div>
                    <BaseFormField label="Status">
                        <BaseSelect v-model="statusFilter" :items="statusFilterOptions" value-key="value" placeholder="All statuses" />
                    </BaseFormField>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center gap-2">
                    <BaseButton class="flex-1" color="neutral" variant="outline" @click="clearFilters">Clear filters</BaseButton>
                    <BaseButton class="flex-1" @click="isFiltersOpen = false">Done</BaseButton>
                </div>
            </template>
        </USlideover>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <BaseTable
                :data="schedules"
                :columns="columns"
                :loading="loading"
                :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                :meta="{ class: { tr: (row: { original: Schedule }) => isClosingSoon(row.original) ? 'bg-warning/10 hover:bg-warning/15' : '' } }"
            >
                <template #title-cell="{ row }">
                    <NuxtLink :to="`/admin/schedules/${row.original.uuid}`" class="font-medium text-highlighted hover:text-primary">
                        {{ row.original.title }}
                    </NuxtLink>
                    <span v-if="isClosingSoon(row.original)" class="ml-2 inline-flex items-center gap-1 text-xs font-medium text-warning">
                        <UIcon name="i-lucide-clock" class="size-3.5" /> closing soon
                    </span>
                </template>
                <template #status-cell="{ row }">
                    <BaseStatusBadge :color="scheduleStatusColor[row.original.status]" :label="row.original.status" />
                </template>
                <template #pasabuy_schedule_date-cell="{ row }">
                    <span class="text-muted">{{ row.original.pasabuy_schedule_date ? formatDate(row.original.pasabuy_schedule_date) : '-' }}</span>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-2">
                        <BaseButton
                            v-if="row.original.status === 'open'"
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-lock"
                            :loading="closingUuid === row.original.uuid"
                            @click="closeSchedule(row.original)"
                        >
                            Close
                        </BaseButton>
                        <BaseButton
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-eye"
                            aria-label="View schedule"
                            :to="`/admin/schedules/${row.original.uuid}`"
                        />
                    </div>
                </template>
                <template #list-item="{ item: scheduleRow }">
                    <ListCard
                        clickable
                        :chevron="false"
                        :tone="isClosingSoon(scheduleRow) ? 'warning' : 'default'"
                        :actions="scheduleActions(scheduleRow)"
                        @click="navigateTo(`/admin/schedules/${scheduleRow.uuid}`)"
                    >
                        <template #leading>
                            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <UIcon name="i-lucide-calendar-clock" class="size-4" />
                            </div>
                        </template>
                        <template #title>
                            <p class="font-medium text-highlighted">{{ scheduleRow.title }}</p>
                        </template>
                        <template #meta>
                            <span class="text-muted">{{ scheduleRow.pasabuy_schedule_date ? formatDate(scheduleRow.pasabuy_schedule_date) : '-' }}</span>
                            <span v-if="isClosingSoon(scheduleRow)" class="inline-flex items-center gap-1 text-xs font-medium text-warning">
                                <UIcon name="i-lucide-clock" class="size-3.5" /> closing soon
                            </span>
                        </template>
                        <template #status>
                            <BaseStatusBadge :color="scheduleStatusColor[scheduleRow.status]" :label="scheduleRow.status" />
                        </template>
                    </ListCard>
                </template>
                <template #empty>
                    <BaseEmptyState
                        icon="i-lucide-calendar-search"
                        message="No schedules found."
                        action-label="Create your first schedule"
                        @action="isCreateModalOpen = true"
                    />
                </template>
            </BaseTable>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <ScheduleCreateModal v-model:open="isCreateModalOpen" @created="onScheduleCreated" />

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
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { Schedule } from '@/types/Schedule'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Schedules' })

const toast = useToast()
const { isClosingSoon } = useScheduleClosingSoon()
const schedules = ref<Schedule[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = 15
const total = ref(0)
const search = ref('')
const monthFilter = ref<number | null>(null)
const yearFilter = ref<number | null>(null)
const statusFilter = ref<string | null>(null)
const isFiltersOpen = ref(false)

const activeFilterCount = computed(() => [monthFilter.value, yearFilter.value, statusFilter.value].filter((value) => value !== null).length)

function clearFilters() {
    monthFilter.value = null
    yearFilter.value = null
    statusFilter.value = null
}

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

const statusFilterOptions = [
    { label: 'All statuses', value: null },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
    { label: 'Finished', value: 'finished' }
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
            year: yearFilter.value || undefined,
            status: statusFilter.value || undefined
        })
        schedules.value = response.data.items
        total.value = response.data.total
    } catch (error) {
        toast.add({
            title: 'Failed to load schedules',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadSchedules() }]
        })
    } finally {
        loading.value = false
    }
}

watch(page, loadSchedules)

watch([monthFilter, yearFilter, statusFilter], () => {
    page.value = 1
    loadSchedules()
})

useSearchDebounce(search, () => {
    page.value = 1
    loadSchedules()
})

const isCreateModalOpen = ref(false)

function onScheduleCreated(schedule: Schedule) {
    navigateTo(`/admin/schedules/${schedule.uuid}`)
}

const closingUuid = ref<string | null>(null)

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

function closeSchedule(scheduleRow: Schedule) {
    askConfirm({
        title: 'Close schedule?',
        description: `Close "${scheduleRow.title}"? It can no longer be edited while closed. You can reopen it later if needed.`,
        confirmLabel: 'Close schedule',
        color: 'primary',
        action: async () => {
            closingUuid.value = scheduleRow.uuid
            try {
                await pasabuyScheduleService.closeSchedule(scheduleRow.uuid)
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

function scheduleActions(scheduleRow: Schedule): DropdownMenuItem[] {
    if (scheduleRow.status !== 'open') return []
    return [
        {
            label: 'Close schedule',
            icon: 'i-lucide-lock',
            loading: closingUuid.value === scheduleRow.uuid,
            onSelect: () => closeSchedule(scheduleRow)
        }
    ]
}

onMounted(loadSchedules)
onPullToRefresh(loadSchedules)
</script>
