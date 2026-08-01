<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Orders</h1>
        </div>

        <div class="sticky top-0 z-10 -mx-6 space-y-2 bg-default/95 px-6 py-2 backdrop-blur-sm">
            <div class="flex items-center gap-2">
                <div class="min-w-0 flex-1">
                    <BaseSearchInput v-model="search" placeholder="Search by customer name, contact, or order no…" class="w-full" />
                </div>
                <BaseButton
                    class="sm:hidden shrink-0"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-list-filter"
                    @click="isFiltersOpen = true"
                >
                    Filters
                    <UBadge v-if="activeFilterCount" color="primary" variant="subtle" size="sm">{{ activeFilterCount }}</UBadge>
                </BaseButton>
            </div>

            <div class="hidden sm:grid grid-cols-4 gap-2">
                <USelect v-model="scheduleFilter" :items="scheduleFilterOptions" value-key="value" class="w-full h-11" />
                <USelect v-model="statusFilter" :items="statusFilterOptions" value-key="value" class="w-full h-11" />
                <USelect v-model="paymentStatusFilter" :items="paymentStatusFilterOptions" value-key="value" class="w-full h-11" />
                <USelect v-model="deliveryStatusFilter" :items="deliveryStatusFilterOptions" value-key="value" class="w-full h-11" />
            </div>
        </div>

        <USlideover v-model:open="isFiltersOpen" side="bottom" title="Filters">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="Schedule">
                        <USelect v-model="scheduleFilter" :items="scheduleFilterOptions" value-key="value" class="w-full h-11" />
                    </UFormField>
                    <UFormField label="Status">
                        <USelect v-model="statusFilter" :items="statusFilterOptions" value-key="value" class="w-full h-11" />
                    </UFormField>
                    <UFormField label="Payment status">
                        <USelect v-model="paymentStatusFilter" :items="paymentStatusFilterOptions" value-key="value" class="w-full h-11" />
                    </UFormField>
                    <UFormField label="Delivery status">
                        <USelect v-model="deliveryStatusFilter" :items="deliveryStatusFilterOptions" value-key="value" class="w-full h-11" />
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
            <BaseTable :data="orders" :columns="orderColumns" :loading="loading" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                <template #customer-cell="{ row }">
                    <p class="font-medium text-highlighted">{{ row.original.customer_name }}</p>
                    <p class="text-sm text-muted">{{ row.original.customer_contact }}</p>
                    <p class="font-mono text-xs text-dimmed">{{ row.original.order_no }}</p>
                </template>
                <template #schedule-cell="{ row }">
                    <NuxtLink
                        v-if="row.original.pasabuy_schedule"
                        :to="`/admin/schedules/${row.original.pasabuy_schedule.uuid}`"
                        class="text-primary hover:underline"
                    >
                        {{ row.original.pasabuy_schedule.title }}
                    </NuxtLink>
                    <span v-else class="text-muted">-</span>
                </template>
                <template #status-cell="{ row }">
                    <OrderStatusBadge :status="row.original.status" />
                </template>
                <template #payment_status-cell="{ row }">
                    <PaymentStatusBadge v-if="row.original.status === 'confirmed'" :status="row.original.payment_status" />
                    <span v-else class="text-muted">-</span>
                </template>
                <template #delivery_status-cell="{ row }">
                    <DeliveryStatusBadge v-if="row.original.status === 'confirmed'" :status="row.original.delivery_status" />
                    <span v-else class="text-muted">-</span>
                </template>
                <template #total_amount-cell="{ row }">
                    {{ orderDisplayAmount(row.original) }}
                </template>
                <template #actions-cell="{ row }">
                    <div v-if="row.original.status === 'confirmed'" class="flex items-center justify-end gap-2">
                        <BaseButton
                            size="xs"
                            color="neutral"
                            variant="soft"
                            @click="toggleDeliveryStatus(row.original)"
                        >
                            {{ row.original.delivery_status === 'not_delivered' ? 'Mark delivered' : 'Mark not delivered' }}
                        </BaseButton>
                        <BaseButton
                            icon="i-lucide-wallet"
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            aria-label="Manage payments"
                            @click="openPaymentsModal(row.original)"
                        />
                    </div>
                </template>
                <template #list-item="{ item: order }">
                    <ListCard :actions="orderActions(order)">
                        <template #title>
                            <p class="font-medium text-highlighted">{{ order.customer_name }}</p>
                        </template>
                        <template #subtitle>
                            {{ order.customer_contact }} · <span class="font-mono text-xs">{{ order.order_no }}</span>
                        </template>
                        <template #meta>
                            <span class="font-medium text-highlighted">₱{{ orderDisplayAmount(order) }}</span>
                            <NuxtLink
                                v-if="order.pasabuy_schedule"
                                :to="`/admin/schedules/${order.pasabuy_schedule.uuid}`"
                                class="text-primary hover:underline"
                            >
                                {{ order.pasabuy_schedule.title }}
                            </NuxtLink>
                        </template>
                        <template #status>
                            <OrderStatusBadge :status="order.status" />
                            <template v-if="order.status === 'confirmed'">
                                <PaymentStatusBadge :status="order.payment_status" />
                                <DeliveryStatusBadge :status="order.delivery_status" />
                            </template>
                        </template>
                    </ListCard>
                </template>
                <template #empty>
                    <BaseEmptyState icon="i-lucide-receipt" message="No orders found." />
                </template>
            </BaseTable>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <OrderPaymentsModal
            v-model:open="isPaymentsModalOpen"
            :order="selectedOrderForPayments"
            @updated="loadOrders"
        />

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
import { orderService } from '@/components/api/admin/OrderService'
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { Order } from '@/types/Order'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Orders' })

interface ScheduleOption {
    uuid: string
    title: string
}

const toast = useToast()
const perPage = 15

const orders = ref<Order[]>([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const search = ref('')
const statusFilter = ref('all')
const scheduleFilter = ref('all')
const paymentStatusFilter = ref('all')
const deliveryStatusFilter = ref('all')
const { data: schedules, ensure: ensureSchedulesLoaded } = useCachedFetch<ScheduleOption[]>(
    'admin-pasabuy-schedules',
    (etag) => pasabuyScheduleService.fetchSchedulesCacheable({ per_page: 100 }, etag)
)
const isFiltersOpen = ref(false)

const activeFilterCount = computed(() =>
    [statusFilter.value, scheduleFilter.value, paymentStatusFilter.value, deliveryStatusFilter.value]
        .filter((value) => value !== 'all').length
)

function clearFilters() {
    statusFilter.value = 'all'
    scheduleFilter.value = 'all'
    paymentStatusFilter.value = 'all'
    deliveryStatusFilter.value = 'all'
}

const statusFilterOptions = [
    { label: 'All statuses', value: 'all' },
    { label: customerOrderStatusLabel.pending, value: 'pending' },
    { label: customerOrderStatusLabel.confirmed, value: 'confirmed' },
    { label: customerOrderStatusLabel.cancelled, value: 'cancelled' }
]

const scheduleFilterOptions = computed(() => [
    { label: 'All schedules', value: 'all' },
    ...(schedules.value ?? []).map((schedule) => ({ label: schedule.title, value: schedule.uuid }))
])

const paymentStatusFilterOptions = [
    { label: 'All payment statuses', value: 'all' },
    { label: paymentStatusLabel.unpaid, value: 'unpaid' },
    { label: paymentStatusLabel.partially_paid, value: 'partially_paid' },
    { label: paymentStatusLabel.paid, value: 'paid' }
]

const deliveryStatusFilterOptions = [
    { label: 'All delivery statuses', value: 'all' },
    { label: deliveryStatusLabel.not_delivered, value: 'not_delivered' },
    { label: deliveryStatusLabel.delivered, value: 'delivered' }
]

function orderDisplayAmount(order: Order) {
    return order.pasabuy_schedule?.status === 'finished' ? order.amount_due : order.total_amount
}

const orderColumns: TableColumn<Order>[] = [
    { id: 'customer', header: 'Customer' },
    { id: 'schedule', header: 'Schedule' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'payment_status', header: 'Payment' },
    { accessorKey: 'delivery_status', header: 'Delivery' },
    { id: 'actions', header: '' }
]

const ordersEtag = ref<string | null>(null)

async function loadOrders() {
    loading.value = true
    try {
        const result = await orderService.fetchOrdersCacheable({
            page: page.value,
            per_page: perPage,
            search: search.value || undefined,
            status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
            schedule_uuid: scheduleFilter.value !== 'all' ? scheduleFilter.value : undefined,
            payment_status: paymentStatusFilter.value !== 'all' ? paymentStatusFilter.value : undefined,
            delivery_status: deliveryStatusFilter.value !== 'all' ? deliveryStatusFilter.value : undefined
        }, ordersEtag.value)
        if (result === 'not-modified') return
        orders.value = result.data.items
        total.value = result.data.total
        ordersEtag.value = result.etag
    } catch (error) {
        toast.add({ title: 'Failed to load orders', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadOrders)

watch([statusFilter, scheduleFilter, paymentStatusFilter, deliveryStatusFilter], () => {
    page.value = 1
    loadOrders()
})

useSearchDebounce(search, () => {
    page.value = 1
    loadOrders()
})

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

async function setDeliveryStatus(order: Order, deliveryStatus: 'not_delivered' | 'delivered') {
    try {
        const response = await orderService.updateDeliveryStatus(order.uuid, deliveryStatus)
        order.delivery_status = response.data.delivery_status
        toast.add({ title: `Order marked as ${deliveryStatusLabel[deliveryStatus].toLowerCase()}`, color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    }
}

function toggleDeliveryStatus(order: Order) {
    const nextStatus = order.delivery_status === 'not_delivered' ? 'delivered' : 'not_delivered'
    askConfirm({
        title: nextStatus === 'delivered' ? 'Mark as delivered?' : 'Mark as not delivered?',
        description: `Mark ${order.customer_name}'s order as ${deliveryStatusLabel[nextStatus]!.toLowerCase()}?`,
        confirmLabel: nextStatus === 'delivered' ? 'Mark delivered' : 'Mark not delivered',
        color: nextStatus === 'delivered' ? 'success' : 'primary',
        action: () => setDeliveryStatus(order, nextStatus)
    })
}

function orderActions(order: Order): DropdownMenuItem[] {
    if (order.status !== 'confirmed') return []
    return [
        {
            label: order.delivery_status === 'not_delivered' ? 'Mark delivered' : 'Mark not delivered',
            icon: order.delivery_status === 'not_delivered' ? 'i-lucide-truck' : 'i-lucide-package-check',
            onSelect: () => toggleDeliveryStatus(order)
        },
        { label: 'Manage payments', icon: 'i-lucide-wallet', onSelect: () => openPaymentsModal(order) }
    ]
}

const isPaymentsModalOpen = ref(false)
const selectedOrderForPayments = ref<Order | null>(null)

function openPaymentsModal(order: Order) {
    selectedOrderForPayments.value = order
    isPaymentsModalOpen.value = true
}

onMounted(() => {
    loadOrders()
    ensureSchedulesLoaded().catch((error) => {
        toast.add({ title: 'Failed to load schedules', description: (error as APIError).message, color: 'error' })
    })
})

onPullToRefresh(() => Promise.all([loadOrders(), ensureSchedulesLoaded(true)]))
</script>
