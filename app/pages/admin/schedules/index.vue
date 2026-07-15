<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Pasabuy Schedules</h1>
            <BaseButton icon="i-lucide-plus" class="hidden sm:inline-flex" @click="openCreateModal">New Schedule</BaseButton>
        </div>

        <FabButton aria-label="New schedule" @click="openCreateModal" />

        <div class="space-y-3">
            <SearchInput v-model="search" placeholder="Search schedules…" class="w-full" />

            <div class="hidden sm:grid grid-cols-2 gap-2">
                <USelect v-model="monthFilter" :items="monthFilterOptions" value-key="value" placeholder="All months" class="w-full" />
                <USelect v-model="yearFilter" :items="yearFilterOptions" value-key="value" placeholder="All years" class="w-full" />
            </div>

            <BaseButton
                class="sm:hidden"
                color="neutral"
                variant="outline"
                icon="i-lucide-list-filter"
                @click="isFiltersOpen = true"
            >
                Filters
                <UBadge v-if="activeFilterCount" color="primary" variant="subtle" size="sm">{{ activeFilterCount }}</UBadge>
            </BaseButton>
        </div>

        <USlideover v-model:open="isFiltersOpen" side="bottom" title="Filters">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="Month">
                        <USelect v-model="monthFilter" :items="monthFilterOptions" value-key="value" placeholder="All months" class="w-full" />
                    </UFormField>
                    <UFormField label="Year">
                        <USelect v-model="yearFilter" :items="yearFilterOptions" value-key="value" placeholder="All years" class="w-full" />
                    </UFormField>
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
            <ResponsiveTable
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
                            trailing-icon="i-lucide-arrow-right"
                            :to="`/admin/schedules/${row.original.uuid}`"
                        >
                            Manage
                        </BaseButton>
                    </div>
                </template>
                <template #list-item="{ item: scheduleRow }">
                    <ListCard
                        clickable
                        :chevron="false"
                        :actions="scheduleActions(scheduleRow)"
                        @click="navigateTo(`/admin/schedules/${scheduleRow.uuid}`)"
                    >
                        <template #title>
                            <p class="font-medium text-highlighted">{{ scheduleRow.title }}</p>
                        </template>
                        <template #meta>
                            <span class="text-muted">{{ scheduleRow.pasabuy_schedule_date ? formatDate(scheduleRow.pasabuy_schedule_date) : '-' }}</span>
                        </template>
                        <template #status>
                            <StatusBadge :color="scheduleStatusColor[scheduleRow.status]" :label="scheduleRow.status" />
                        </template>
                    </ListCard>
                </template>
                <template #empty>
                    <TableEmptyState
                        icon="i-lucide-calendar-search"
                        message="No schedules found."
                        action-label="Create your first schedule"
                        @action="openCreateModal"
                    />
                </template>
            </ResponsiveTable>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <BaseModal
            v-model:open="isModalOpen"
            title="New Pasabuy Schedule"
            show-default-footer
            form-id="schedule-create-form"
            confirm-label="Create"
            :loading="saving"
        >
            <form id="schedule-create-form" class="space-y-4" @submit.prevent="onCreate">
                <UFormField label="Title" required>
                    <UInput v-model="form.title" class="w-full" />
                </UFormField>
                <UFormField label="Description">
                    <UTextarea v-model="form.description" class="w-full" />
                </UFormField>
                <UFormField label="Pasabuy date" hint="The date you'll go to the store" required>
                    <UInput v-model="form.pasabuy_schedule_date" type="date" required class="w-full" />
                </UFormField>
            </form>
        </BaseModal>

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
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Schedules' })

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
const isFiltersOpen = ref(false)

const activeFilterCount = computed(() => [monthFilter.value, yearFilter.value].filter((value) => value !== null).length)

function clearFilters() {
    monthFilter.value = null
    yearFilter.value = null
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
</script>
