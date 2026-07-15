<template>
    <div class="min-h-full space-y-4" @touchstart="onTabsTouchStart" @touchmove="onTabsTouchMove" @touchend="onTabsTouchEnd">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Customers</h1>
        </div>

        <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #approved>
                <div class="overflow-hidden">
                <div class="mt-4 space-y-4" :style="panelStyle">
                    <SearchInput v-model="search" placeholder="Search customers…" />

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <div class="hidden sm:block">
                            <UTable
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
                                            trailing-icon="i-lucide-arrow-right"
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
                                <template #empty>
                                    <TableEmptyState icon="i-lucide-users" message="No approved customers found." />
                                </template>
                            </UTable>
                        </div>
                        <div class="sm:hidden space-y-2 p-2">
                            <ListCard v-for="customer in approvedCustomers" :key="customer.uuid" :actions="approvedCustomerActions(customer)">
                                <template #title>
                                    <p class="font-medium text-highlighted">{{ customer.first_name }} {{ customer.last_name }}</p>
                                </template>
                                <template #subtitle>
                                    {{ customer.email }}
                                </template>
                                <template #meta>
                                    <span class="text-muted">{{ customer.contact_number ?? '-' }}</span>
                                </template>
                            </ListCard>
                            <TableEmptyState v-if="approvedCustomers.length === 0" icon="i-lucide-users" message="No approved customers found." />
                        </div>
                    </UCard>

                    <div v-if="approvedTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="approvedPage" :total="approvedTotal" :items-per-page="perPage" />
                    </div>
                </div>
                </div>
            </template>

            <template #pending>
                <div class="overflow-hidden">
                <div class="mt-4 space-y-4" :style="panelStyle">
                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <div class="hidden sm:block">
                            <UTable
                                :data="pendingCustomers"
                                :columns="pendingColumns"
                                :loading="pendingLoading"
                                :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                            >
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
                                <template #empty>
                                    <TableEmptyState icon="i-lucide-user-check" message="No pending registrations." />
                                </template>
                            </UTable>
                        </div>
                        <div class="sm:hidden space-y-2 p-2">
                            <ListCard v-for="customer in pendingCustomers" :key="customer.uuid" :actions="pendingCustomerActions(customer)">
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
                            </ListCard>
                            <TableEmptyState v-if="pendingCustomers.length === 0" icon="i-lucide-user-check" message="No pending registrations." />
                        </div>
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
            <div class="hidden sm:block">
                <UTable :data="customerOrders" :columns="orderColumns" :loading="loadingOrders">
                    <template #pasabuy_schedule-cell="{ row }">
                        <NuxtLink
                            v-if="row.original.pasabuy_schedule"
                            :to="`/admin/schedules/${row.original.pasabuy_schedule.uuid}`"
                            class="text-primary hover:underline"
                        >
                            {{ row.original.pasabuy_schedule.title }}
                        </NuxtLink>
                    </template>
                    <template #status-cell="{ row }">
                        <OrderStatusBadge :status="row.original.status" />
                    </template>
                    <template #created_at-cell="{ row }">
                        <span class="text-muted">{{ formatDate(row.original.created_at) }}</span>
                    </template>
                    <template #empty>
                        <TableEmptyState icon="i-lucide-receipt" message="No orders yet." />
                    </template>
                </UTable>
            </div>
            <div class="sm:hidden space-y-2 p-2">
                <ListCard v-for="order in customerOrders" :key="order.uuid">
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
                        <span class="font-medium text-highlighted">₱{{ order.total_amount }}</span>
                        <span class="text-muted">{{ formatDate(order.created_at) }}</span>
                    </template>
                </ListCard>
                <TableEmptyState v-if="customerOrders.length === 0" icon="i-lucide-receipt" message="No orders yet." />
            </div>
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
import { customerService } from '@/components/api/admin/CustomerService'
import APIError from '@/components/api/user/APIError'
import type { DropdownMenuItem, TableColumn, TabsItem } from '@nuxt/ui'

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

const { onTouchStart: onTabsTouchStart, onTouchMove: onTabsTouchMove, onTouchEnd: onTabsTouchEnd, panelStyle } = useSwipeTabs(
    activeTab,
    computed(() => tabs.value.map((tab) => tab.value as 'approved' | 'pending'))
)

const approvedColumns: TableColumn<Customer>[] = [
    { id: 'customer', header: 'Customer' },
    { accessorKey: 'contact_number', header: 'Contact' },
    { id: 'actions', header: '' }
]

const pendingColumns: TableColumn<Customer>[] = [
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

async function loadApproved() {
    approvedLoading.value = true
    try {
        const response = await customerService.fetchCustomers({
            page: approvedPage.value,
            per_page: perPage,
            search: search.value || undefined,
            is_approved: '1'
        })
        approvedCustomers.value = response.data.data
        approvedTotal.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load customers', description: (error as APIError).message, color: 'error' })
    } finally {
        approvedLoading.value = false
    }
}

async function loadPending() {
    pendingLoading.value = true
    try {
        const response = await customerService.fetchCustomers({
            page: pendingPage.value,
            per_page: perPage,
            is_approved: '0'
        })
        pendingCustomers.value = response.data.data
        pendingTotal.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load customers', description: (error as APIError).message, color: 'error' })
    } finally {
        pendingLoading.value = false
    }
}

watch(approvedPage, loadApproved)
watch(pendingPage, loadPending)

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
        toast.add({ title: 'Failed to load orders', description: (error as APIError).message, color: 'error' })
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
        toast.add({ title: 'Customer approved', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Approval failed', description: (error as APIError).message, color: 'error' })
    } finally {
        actingOn.value = null
    }
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
                toast.add({ title: 'Approval revoked', color: 'success' })
            } catch (error) {
                toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
            } finally {
                actingOn.value = null
            }
        }
    })
}

function approvedCustomerActions(customer: Customer): DropdownMenuItem[] {
    return [
        { label: 'View orders', icon: 'i-lucide-arrow-right', onSelect: () => viewOrders(customer) },
        { label: 'Revoke', icon: 'i-lucide-user-x', color: 'error', onSelect: () => revokeCustomer(customer) }
    ]
}

function pendingCustomerActions(customer: Customer): DropdownMenuItem[] {
    return [
        { label: 'Approve', icon: 'i-lucide-check', color: 'success', onSelect: () => approveCustomer(customer) }
    ]
}

onMounted(() => {
    loadApproved()
    loadPending()
})
</script>
