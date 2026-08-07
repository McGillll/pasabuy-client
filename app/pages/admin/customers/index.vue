<template>
    <div class="min-h-full space-y-4" @touchstart="onTabsTouchStart" @touchmove="onTabsTouchMove" @touchend="onTabsTouchEnd">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Customers</h1>
        </div>

        <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #approved>
                <div class="overflow-x-clip">
                <div class="mt-4 space-y-4" ref="panelEl">
                    <div class="sticky top-0 z-10 -mx-6 border-b border-default bg-default px-6 py-2 shadow-chrome">
                        <BaseSearchInput v-model="search" placeholder="Search customers…" />
                    </div>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <BaseTable
                            :data="approvedCustomers"
                            :columns="approvedColumns"
                            :loading="approvedLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                        >
                            <template #customer-cell="{ row }">
                                <p class="font-medium text-highlighted">{{ row.original.first_name }} {{ row.original.last_name }}</p>
                                <p class="text-sm text-muted truncate">{{ row.original.email }}</p>
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end gap-2">
                                    <BaseButton
                                        size="sm"
                                        color="neutral"
                                        variant="ghost"
                                        trailing-icon="i-lucide-eye"
                                        @click="viewOrders(row.original)"
                                    >
                                        View orders
                                    </BaseButton>
                                    <BaseButton
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        :loading="actingOn === row.original.uuid"
                                        @click="revokeCustomer(row.original)"
                                    >
                                        Revoke
                                    </BaseButton>
                                </div>
                            </template>
                            <template #list-item="{ item: customer }">
                                <div>
                                    <ListCard>
                                        <template #leading>
                                            <BaseAvatar :name="`${customer.first_name} ${customer.last_name}`" />
                                        </template>
                                        <template #title>
                                            <p class="font-medium text-highlighted">{{ customer.first_name }} {{ customer.last_name }}</p>
                                        </template>
                                        <template #subtitle>
                                            {{ customer.email }}
                                        </template>
                                        <template #meta>
                                            <span class="text-muted">{{ customer.contact_number ?? '-' }}</span>
                                        </template>
                                        <template #trailing>
                                            <ListCardButton
                                                icon="i-lucide-ellipsis-vertical"
                                                aria-label="Customer actions"
                                                @click.stop="toggleExpanded(customer.uuid)"
                                            />
                                        </template>
                                    </ListCard>

                                    <Transition
                                        enter-active-class="transition-all duration-200 ease-out"
                                        enter-from-class="max-h-0 opacity-0"
                                        enter-to-class="max-h-32 opacity-100"
                                        leave-active-class="transition-all duration-150 ease-in"
                                        leave-from-class="max-h-32 opacity-100"
                                        leave-to-class="max-h-0 opacity-0"
                                    >
                                        <div v-if="expandedCustomerUuid === customer.uuid" class="overflow-hidden">
                                            <div class="mt-2 flex items-center gap-2 rounded-lg bg-elevated p-2 ring-1 ring-default">
                                                <BaseButton
                                                    class="flex-1"
                                                    color="neutral"
                                                    variant="soft"
                                                    icon="i-lucide-eye"
                                                    @click="viewOrders(customer); expandedCustomerUuid = null"
                                                >
                                                    View orders
                                                </BaseButton>
                                                <BaseButton
                                                    class="flex-1"
                                                    color="error"
                                                    variant="outline"
                                                    icon="i-lucide-user-x"
                                                    :loading="actingOn === customer.uuid"
                                                    @click="revokeCustomer(customer); expandedCustomerUuid = null"
                                                >
                                                    Revoke
                                                </BaseButton>
                                            </div>
                                        </div>
                                    </Transition>
                                </div>
                            </template>
                            <template #empty>
                                <BaseEmptyState icon="i-lucide-users" message="No approved customers found." />
                            </template>
                        </BaseTable>
                    </UCard>

                    <div v-if="approvedTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="approvedPage" :total="approvedTotal" :items-per-page="perPage" />
                    </div>
                </div>
                </div>
            </template>

            <template #pending>
                <div class="overflow-x-clip">
                <div class="mt-4 space-y-4" ref="panelEl">
                    <div
                        v-if="selectedPendingUuids.size > 0"
                        class="sticky top-2 z-10 flex flex-col gap-3 rounded-lg bg-elevated p-3 shadow-sm ring-1 ring-default sm:flex-row sm:items-center"
                    >
                        <div class="flex items-center justify-between gap-2 sm:block">
                            <div>
                                <span class="text-sm font-medium text-highlighted"><BaseNumber :value="selectedPendingUuids.size" :maximum-fraction-digits="0" /> selected</span>
                                <button
                                    v-if="pendingTotal > perPage && selectedPendingUuids.size < pendingTotal"
                                    type="button"
                                    class="block text-xs text-primary hover:underline"
                                    :disabled="selectingAllPending"
                                    @click="selectAllMatchingPending"
                                >
                                    {{ selectingAllPending ? 'Selecting...' : `Select all ${pendingTotal} pending` }}
                                </button>
                            </div>
                            <BaseButton class="sm:hidden" size="sm" color="neutral" variant="ghost" @click="clearPendingSelection">
                                Clear
                            </BaseButton>
                        </div>
                        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-1 sm:justify-end">
                            <BaseButton class="hidden sm:inline-flex" color="neutral" variant="ghost" @click="clearPendingSelection">
                                Clear selection
                            </BaseButton>
                            <BaseButton color="error" variant="outline" @click="bulkRejectPending">
                                Reject selected
                            </BaseButton>
                            <BaseButton color="success" @click="bulkApprovePending">
                                Approve selected
                            </BaseButton>
                        </div>
                    </div>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <BaseTable
                            :data="pendingCustomers"
                            :columns="pendingColumns"
                            :loading="pendingLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                        >
                            <template #select-header>
                                <div class="flex h-11 w-11 items-center justify-center">
                                    <BaseCheckbox
                                        :model-value="allPendingSelected"
                                        aria-label="Select all pending customers"
                                        @update:model-value="toggleSelectAllPending"
                                    />
                                </div>
                            </template>
                            <template #select-cell="{ row }">
                                <div class="flex h-11 w-11 items-center justify-center">
                                    <BaseCheckbox
                                        :model-value="selectedPendingUuids.has(row.original.uuid)"
                                        aria-label="Select customer"
                                        @update:model-value="() => togglePendingSelection(row.original.uuid)"
                                    />
                                </div>
                            </template>
                            <template #customer-cell="{ row }">
                                <p class="font-medium text-highlighted">{{ row.original.first_name }} {{ row.original.last_name }}</p>
                                <p class="text-sm text-muted truncate">{{ row.original.email }}</p>
                            </template>
                            <template #created_at-cell="{ row }">
                                <span class="text-muted">{{ formatDate(row.original.created_at) }}</span>
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end">
                                    <BaseButton
                                        size="sm"
                                        color="success"
                                        variant="soft"
                                        :loading="actingOn === row.original.uuid"
                                        @click="approveCustomer(row.original)"
                                    >
                                        Approve
                                    </BaseButton>
                                </div>
                            </template>
                            <template #list-item="{ item: customer }">
                                <ListCard>
                                    <template #leading>
                                        <div class="flex items-center gap-2">
                                            <div class="flex h-11 w-11 items-center justify-center">
                                                <BaseCheckbox
                                                    :model-value="selectedPendingUuids.has(customer.uuid)"
                                                    aria-label="Select customer"
                                                    @update:model-value="() => togglePendingSelection(customer.uuid)"
                                                    @click.stop
                                                />
                                            </div>
                                            <BaseAvatar :name="`${customer.first_name} ${customer.last_name}`" />
                                        </div>
                                    </template>
                                    <template #title>
                                        <p class="font-medium text-highlighted">{{ customer.first_name }} {{ customer.last_name }}</p>
                                    </template>
                                    <template #subtitle>
                                        {{ customer.email }}
                                    </template>
                                    <template #meta>
                                        <span class="text-muted">{{ customer.contact_number ?? '-' }}</span>
                                        <span class="text-muted">{{ formatDate(customer.created_at) }}</span>
                                    </template>
                                    <template #trailing>
                                        <BaseButton
                                            size="sm"
                                            color="success"
                                            variant="soft"
                                            :loading="actingOn === customer.uuid"
                                            @click.stop="approveCustomer(customer)"
                                        >
                                            Approve
                                        </BaseButton>
                                    </template>
                                </ListCard>
                            </template>
                            <template #empty>
                                <BaseEmptyState icon="i-lucide-user-check" message="No pending registrations." />
                            </template>
                        </BaseTable>
                    </UCard>

                    <div v-if="pendingTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="pendingPage" :total="pendingTotal" :items-per-page="perPage" />
                    </div>
                </div>
                </div>
            </template>
        </UTabs>

        <BaseModal
            v-model:open="isOrdersModalOpen"
            :title="selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}'s orders` : 'Orders'"
            view-only
        >
            <BaseTable :data="customerOrders" :columns="orderColumns" :loading="loadingOrders">
                <template #pasabuy_schedule-cell="{ row }">
                    <NuxtLink
                        v-if="row.original.pasabuy_schedule"
                        :to="`/admin/schedules/${row.original.pasabuy_schedule.uuid}`"
                        class="text-primary hover:underline"
                    >
                        {{ row.original.pasabuy_schedule.title }}
                    </NuxtLink>
                </template>
                <template #total_amount-cell="{ row }">
                    <BaseNumber :value="row.original.total_amount" prefix="₱" class="font-mono tabular-nums" />
                </template>
                <template #status-cell="{ row }">
                    <OrderStatusBadge :status="row.original.status" />
                </template>
                <template #created_at-cell="{ row }">
                    <span class="text-muted">{{ formatDate(row.original.created_at) }}</span>
                </template>
                <template #list-item="{ item: order }">
                    <ListCard>
                        <template #title>
                            <NuxtLink
                                v-if="order.pasabuy_schedule"
                                :to="`/admin/schedules/${order.pasabuy_schedule.uuid}`"
                                class="font-medium text-primary hover:underline"
                            >
                                {{ order.pasabuy_schedule.title }}
                            </NuxtLink>
                        </template>
                        <template #meta>
                            <BaseNumber :value="order.total_amount" prefix="₱" class="font-mono tabular-nums font-medium text-highlighted" />
                            <span class="text-muted">{{ formatDate(order.created_at) }}</span>
                        </template>
                    </ListCard>
                </template>
                <template #empty>
                    <BaseEmptyState icon="i-lucide-receipt" message="No orders yet." />
                </template>
            </BaseTable>
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
import { customerService } from '@/components/api/admin/CustomerService'
import APIError from '@/components/api/user/APIError'
import type { TableColumn, TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Customers' })

interface Customer {
    uuid: string
    first_name: string
    last_name: string
    email: string
    contact_number: string | null
    messenger_name: string | null
    is_approved: boolean
    approved_at: string | null
    created_at: string
}

interface Order {
    uuid: string
    customer_name: string
    customer_contact: string
    status: 'pending' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    pasabuy_schedule: { uuid: string; title: string; status: string; is_open: boolean; created_at: string } | null
    created_at: string
}

const toast = useToast()
const perPage = 15
const actingOn = ref<string | null>(null)

const activeTab = ref<'approved' | 'pending'>('approved')

const tabs = computed<TabsItem[]>(() => [
    { label: 'Approved', icon: 'i-lucide-user-check', value: 'approved', slot: 'approved' },
    {
        label: 'Pending',
        icon: 'i-lucide-clock',
        value: 'pending',
        slot: 'pending',
        badge: pendingTotal.value > 0 ? pendingTotal.value : undefined
    }
])

const { onTouchStart: onTabsTouchStart, onTouchMove: onTabsTouchMove, onTouchEnd: onTabsTouchEnd, panelEl } = useSwipeTabs(
    activeTab,
    computed(() => tabs.value.map((tab) => tab.value as 'approved' | 'pending'))
)

const approvedColumns: TableColumn<Customer>[] = [
    { id: 'customer', header: 'Customer' },
    { accessorKey: 'contact_number', header: 'Contact' },
    { id: 'actions', header: '' }
]

const pendingColumns: TableColumn<Customer>[] = [
    { id: 'select', header: '' },
    { id: 'customer', header: 'Customer' },
    { accessorKey: 'contact_number', header: 'Contact' },
    { accessorKey: 'created_at', header: 'Registered' },
    { id: 'actions', header: '' }
]

// Each tab keeps its own list/page/total, fetched with an explicit is_approved
// filter: never shared state between tabs, so they can't show the same data.
const approvedCustomers = ref<Customer[]>([])
const approvedLoading = ref(false)
const approvedPage = ref(1)
const approvedTotal = ref(0)
const search = ref('')

const pendingCustomers = ref<Customer[]>([])
const pendingLoading = ref(false)
const pendingPage = ref(1)
const pendingTotal = ref(0)

useEscapeKey(() => {
    if (selectedPendingUuids.value.size > 0) clearPendingSelection()
})

const approvedEtag = ref<string | null>(null)
const pendingEtag = ref<string | null>(null)

async function loadApproved() {
    approvedLoading.value = true
    try {
        const result = await customerService.fetchCustomersCacheable({
            page: approvedPage.value,
            per_page: perPage,
            search: search.value || undefined,
            is_approved: '1'
        }, approvedEtag.value)
        if (result === 'not-modified') return
        approvedCustomers.value = result.data.items
        approvedTotal.value = result.data.total
        approvedEtag.value = result.etag
    } catch (error) {
        toast.add({
            title: 'Failed to load customers',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadApproved() }]
        })
    } finally {
        approvedLoading.value = false
    }
}

async function loadPending() {
    pendingLoading.value = true
    try {
        const result = await customerService.fetchCustomersCacheable({
            page: pendingPage.value,
            per_page: perPage,
            is_approved: '0'
        }, pendingEtag.value)
        if (result === 'not-modified') return
        pendingCustomers.value = result.data.items
        pendingTotal.value = result.data.total
        pendingEtag.value = result.etag
        pruneSelectedPending()
    } catch (error) {
        toast.add({
            title: 'Failed to load customers',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadPending() }]
        })
    } finally {
        pendingLoading.value = false
    }
}

watch(approvedPage, loadApproved)
watch(pendingPage, () => {
    clearPendingSelection()
    loadPending()
})

useSearchDebounce(search, () => {
    approvedPage.value = 1
    loadApproved()
})

const isOrdersModalOpen = ref(false)
const selectedCustomer = ref<Customer | null>(null)
const customerOrders = ref<Order[]>([])
const loadingOrders = ref(false)

const orderColumns: TableColumn<Order>[] = [
    { id: 'pasabuy_schedule', header: 'Schedule' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'created_at', header: 'Date' }
]

async function viewOrders(customer: Customer) {
    selectedCustomer.value = customer
    isOrdersModalOpen.value = true
    loadingOrders.value = true
    try {
        const response = await customerService.fetchCustomerOrders(customer.uuid)
        customerOrders.value = response.data
    } catch (error) {
        toast.add({
            title: 'Failed to load orders',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => viewOrders(customer) }]
        })
    } finally {
        loadingOrders.value = false
    }
}

async function approveCustomer(customer: Customer) {
    actingOn.value = customer.uuid
    try {
        await customerService.approveCustomer(customer.uuid)
        pendingCustomers.value = pendingCustomers.value.filter((c) => c.uuid !== customer.uuid)
        pendingTotal.value = Math.max(0, pendingTotal.value - 1)
        await loadApproved()
        toast.add({
            title: 'Customer approved',
            color: 'success',
            actions: [{ label: 'Undo', onClick: () => undoApproveCustomer(customer) }]
        })
    } catch (error) {
        toast.add({ title: 'Approval failed', description: (error as APIError).message, color: 'error' })
    } finally {
        actingOn.value = null
    }
}

async function undoApproveCustomer(customer: Customer) {
    try {
        await customerService.rejectCustomer(customer.uuid)
        approvedCustomers.value = approvedCustomers.value.filter((c) => c.uuid !== customer.uuid)
        approvedTotal.value = Math.max(0, approvedTotal.value - 1)
        await loadPending()
        toast.add({ title: 'Approval undone', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Undo failed', description: (error as APIError).message, color: 'error' })
    }
}

const selectedPendingUuids = ref<Set<string>>(new Set())
const selectingAllPending = ref(false)

const allPendingSelected = computed(() =>
    pendingCustomers.value.length > 0 && pendingCustomers.value.every((c) => selectedPendingUuids.value.has(c.uuid))
)

async function selectAllMatchingPending() {
    if (pendingTotal.value === 0) return
    selectingAllPending.value = true
    try {
        const result = await customerService.fetchCustomers({
            page: 1,
            per_page: pendingTotal.value,
            is_approved: '0'
        })
        selectedPendingUuids.value = new Set(result.data.items.map((c: Customer) => c.uuid))
    } catch (error) {
        toast.add({ title: 'Could not select all pending', description: (error as APIError).message, color: 'error' })
    } finally {
        selectingAllPending.value = false
    }
}

function togglePendingSelection(uuid: string) {
    const next = new Set(selectedPendingUuids.value)
    if (next.has(uuid)) next.delete(uuid)
    else next.add(uuid)
    selectedPendingUuids.value = next
}

function toggleSelectAllPending() {
    selectedPendingUuids.value = allPendingSelected.value
        ? new Set()
        : new Set(pendingCustomers.value.map((c) => c.uuid))
}

function clearPendingSelection() {
    selectedPendingUuids.value = new Set()
}

function pruneSelectedPending() {
    const validUuids = new Set(pendingCustomers.value.map((c) => c.uuid))
    selectedPendingUuids.value = new Set([...selectedPendingUuids.value].filter((uuid) => validUuids.has(uuid)))
}

async function runBulkAction(uuids: string[], action: (uuid: string) => Promise<any>) {
    const results = await Promise.allSettled(uuids.map((uuid) => action(uuid)))
    const failedUuids = uuids.filter((_, index) => results[index]!.status === 'rejected')
    const succeeded = results.length - failedUuids.length
    return { succeeded, failed: failedUuids.length, failedUuids }
}

async function undoBulkApprove(approvedUuids: string[]) {
    await runBulkAction(approvedUuids, (uuid) => customerService.rejectCustomer(uuid))
    await Promise.all([loadApproved(), loadPending()])
    toast.add({ title: `${approvedUuids.length} approval${approvedUuids.length === 1 ? '' : 's'} undone`, color: 'success' })
}

async function runApprovePending(uuids: string[]) {
    const { succeeded, failed, failedUuids } = await runBulkAction(uuids, (uuid) => customerService.approveCustomer(uuid))
    const approvedUuids = uuids.filter((uuid) => !failedUuids.includes(uuid))
    pendingCustomers.value = pendingCustomers.value.filter((c) => !approvedUuids.includes(c.uuid))
    pendingTotal.value = Math.max(0, pendingTotal.value - succeeded)
    selectedPendingUuids.value = new Set(failedUuids)
    await Promise.all([loadApproved(), loadPending()])
    toast.add({
        title: failed > 0 ? `${succeeded} approved, ${failed} failed` : `${succeeded} customer${succeeded === 1 ? '' : 's'} approved`,
        description: failed > 0 ? 'The failed customers stay selected so you can try again.' : undefined,
        color: failed > 0 ? 'warning' : 'success',
        actions: [
            ...(succeeded > 0 ? [{ label: 'Undo', onClick: () => undoBulkApprove(approvedUuids) }] : []),
            ...(failed > 0 ? [{ label: 'Retry failed', onClick: () => runApprovePending(failedUuids) }] : [])
        ]
    })
}

function bulkApprovePending() {
    const uuids = Array.from(selectedPendingUuids.value)
    if (uuids.length === 0) return

    askConfirm({
        title: 'Approve selected customers?',
        description: `This will approve ${uuids.length} customer${uuids.length === 1 ? '' : 's'}.`,
        confirmLabel: 'Approve',
        color: 'success',
        action: () => runApprovePending(uuids)
    })
}

async function undoBulkReject(rejectedUuids: string[]) {
    await runBulkAction(rejectedUuids, (uuid) => customerService.approveCustomer(uuid))
    await Promise.all([loadApproved(), loadPending()])
    toast.add({ title: `${rejectedUuids.length} rejection${rejectedUuids.length === 1 ? '' : 's'} undone`, color: 'success' })
}

async function runRejectPending(uuids: string[]) {
    const { succeeded, failed, failedUuids } = await runBulkAction(uuids, (uuid) => customerService.rejectCustomer(uuid))
    const rejectedUuids = uuids.filter((uuid) => !failedUuids.includes(uuid))
    pendingCustomers.value = pendingCustomers.value.filter((c) => !rejectedUuids.includes(c.uuid))
    pendingTotal.value = Math.max(0, pendingTotal.value - succeeded)
    selectedPendingUuids.value = new Set(failedUuids)
    await loadPending()
    toast.add({
        title: failed > 0 ? `${succeeded} rejected, ${failed} failed` : `${succeeded} customer${succeeded === 1 ? '' : 's'} rejected`,
        description: failed > 0 ? 'The failed customers stay selected so you can try again.' : undefined,
        color: failed > 0 ? 'warning' : 'success',
        actions: [
            ...(succeeded > 0 ? [{ label: 'Undo', onClick: () => undoBulkReject(rejectedUuids) }] : []),
            ...(failed > 0 ? [{ label: 'Retry failed', onClick: () => runRejectPending(failedUuids) }] : [])
        ]
    })
}

function bulkRejectPending() {
    const uuids = Array.from(selectedPendingUuids.value)
    if (uuids.length === 0) return

    askConfirm({
        title: 'Reject selected customers?',
        description: `This will reject ${uuids.length} customer${uuids.length === 1 ? '' : 's'}.`,
        confirmLabel: 'Reject',
        color: 'error',
        action: () => runRejectPending(uuids)
    })
}

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

function revokeCustomer(customer: Customer) {
    askConfirm({
        title: 'Revoke approval?',
        description: `Revoke approval for ${customer.first_name} ${customer.last_name}?`,
        confirmLabel: 'Revoke',
        color: 'error',
        action: async () => {
            actingOn.value = customer.uuid
            try {
                await customerService.rejectCustomer(customer.uuid)
                approvedCustomers.value = approvedCustomers.value.filter((c) => c.uuid !== customer.uuid)
                approvedTotal.value = Math.max(0, approvedTotal.value - 1)
                await loadPending()
                toast.add({
                    title: 'Approval revoked',
                    color: 'success',
                    actions: [{ label: 'Undo', onClick: () => undoApproveCustomer(customer) }]
                })
            } catch (error) {
                toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
            } finally {
                actingOn.value = null
            }
        }
    })
}

const expandedCustomerUuid = ref<string | null>(null)

function toggleExpanded(uuid: string) {
    expandedCustomerUuid.value = expandedCustomerUuid.value === uuid ? null : uuid
}

onMounted(() => {
    loadApproved()
    loadPending()
})

onPullToRefresh(() => Promise.all([loadApproved(), loadPending()]))
</script>
