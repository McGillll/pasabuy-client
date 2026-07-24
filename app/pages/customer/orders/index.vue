<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">
                {{ user?.first_name ? `Hi, ${user.first_name}` : 'My Orders' }}
            </h1>
            <p class="mt-1 text-sm text-muted">A history of every pasabuy order you've placed.</p>
        </div>

        <UAlert
            v-if="attentionOrder"
            color="warning"
            variant="subtle"
            icon="i-lucide-circle-alert"
            title="Needs your attention"
            :description="`${attentionOrder.pasabuy_schedule?.title} has an outstanding balance of ₱${attentionOrder.amount_due}.`"
        >
            <template #actions>
                <BaseButton size="xs" color="warning" variant="solid" @click="viewOrder(attentionOrder)">
                    View order
                </BaseButton>
            </template>
        </UAlert>

        <UCard>
            <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <div>
                    <p class="text-xs text-muted">Total orders</p>
                    <p class="text-2xl font-semibold text-highlighted">{{ total }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span v-for="stat in statusBreakdown" :key="stat.label" class="flex items-center gap-1.5 text-muted">
                        <span class="size-2 rounded-full" :class="stat.dotClass" />
                        {{ stat.label }} <span class="font-medium text-highlighted">{{ stat.count }}</span>
                    </span>
                </div>
            </div>
        </UCard>

        <div class="space-y-3">
            <UInput
                v-model="search"
                icon="i-lucide-search"
                placeholder="Search by pasabuy title…"
                class="w-full sm:w-72"
            />

            <div class="hidden sm:grid grid-cols-2 gap-2 lg:grid-cols-5">
                <USelect v-model="statusFilter" :items="statusFilterOptions" value-key="value" class="w-full" />
                <USelect v-model="paymentStatusFilter" :items="paymentStatusFilterOptions" value-key="value" class="w-full" />
                <USelect v-model="deliveryStatusFilter" :items="deliveryStatusFilterOptions" value-key="value" class="w-full" />
                <UInput v-model="dateFrom" type="date" placeholder="From" class="w-full" />
                <UInput v-model="dateTo" type="date" placeholder="To" class="w-full" />
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
                    <UFormField label="Status">
                        <USelect v-model="statusFilter" :items="statusFilterOptions" value-key="value" class="w-full" />
                    </UFormField>
                    <UFormField label="Payment status">
                        <USelect v-model="paymentStatusFilter" :items="paymentStatusFilterOptions" value-key="value" class="w-full" />
                    </UFormField>
                    <UFormField label="Delivery status">
                        <USelect v-model="deliveryStatusFilter" :items="deliveryStatusFilterOptions" value-key="value" class="w-full" />
                    </UFormField>
                    <div class="grid grid-cols-2 gap-4">
                        <UFormField label="From date">
                            <UInput v-model="dateFrom" type="date" class="w-full" />
                        </UFormField>
                        <UFormField label="To date">
                            <UInput v-model="dateTo" type="date" class="w-full" />
                        </UFormField>
                    </div>
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
                :data="orders"
                :columns="columns"
                :loading="loading"
                :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
            >
                <template #schedule-cell="{ row }">
                    <NuxtLink
                        v-if="row.original.pasabuy_schedule"
                        :to="`/pasabuy/${row.original.pasabuy_schedule.uuid}`"
                        class="font-medium text-highlighted hover:text-primary"
                    >
                        {{ row.original.pasabuy_schedule.title }}
                    </NuxtLink>
                    <p class="font-mono text-xs text-dimmed">{{ row.original.order_no }}</p>
                </template>
                <template #total_amount-cell="{ row }">
                    {{ orderDisplayAmount(row.original) }}
                </template>
                <template #status-cell="{ row }">
                    <OrderStatusBadge :status="row.original.status" />
                </template>
                <template #payment_status-cell="{ row }">
                    <PaymentStatusBadge v-if="row.original.pasabuy_schedule?.status === 'finished'" :status="row.original.payment_status" />
                    <span v-else class="text-muted">-</span>
                </template>
                <template #delivery_status-cell="{ row }">
                    <DeliveryStatusBadge v-if="row.original.pasabuy_schedule?.status === 'finished'" :status="row.original.delivery_status" />
                    <span v-else class="text-muted">-</span>
                </template>
                <template #created_at-cell="{ row }">
                    <span class="text-muted">{{ formatDate(row.original.created_at) }}</span>
                </template>
                <template #actions-cell="{ row }">
                    <BaseButton size="sm" color="neutral" variant="ghost" @click="viewOrder(row.original)">
                        View
                    </BaseButton>
                </template>
                <template #list-item="{ item: order }">
                    <ListCard clickable @click="viewOrder(order)">
                        <template #title>
                            <span v-if="order.pasabuy_schedule" class="font-medium text-highlighted">
                                {{ order.pasabuy_schedule.title }}
                            </span>
                        </template>
                        <template #subtitle>
                            <span class="font-mono text-xs">{{ order.order_no }}</span>
                        </template>
                        <template #meta>
                            <span class="font-medium text-highlighted">₱{{ orderDisplayAmount(order) }}</span>
                            <span class="text-muted">{{ formatDate(order.created_at) }}</span>
                        </template>
                        <template #status>
                            <OrderStatusBadge :status="order.status" />
                            <template v-if="order.pasabuy_schedule?.status === 'finished'">
                                <PaymentStatusBadge :status="order.payment_status" />
                                <DeliveryStatusBadge :status="order.delivery_status" />
                            </template>
                        </template>
                    </ListCard>
                </template>
                <template #empty>
                    <div class="flex flex-col items-center gap-3 py-10">
                        <UIcon name="i-lucide-receipt" class="size-8 text-dimmed" />
                        <p class="text-sm text-muted">{{ emptyStateMessage }}</p>
                    </div>
                </template>
            </ResponsiveTable>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <BaseModal
            v-model:open="isDetailOpen"
            :title="selectedOrder?.pasabuy_schedule?.title ?? 'Order details'"
            :description="selectedOrder?.order_no"
            view-only
        >
            <div v-if="selectedOrder" class="space-y-4">
                <div class="flex items-center justify-between">
                    <OrderStatusBadge :status="selectedOrder.status" />
                    <span class="text-sm text-muted">{{ formatDate(selectedOrder.created_at) }}</span>
                </div>

                <template v-if="selectedOrder.pasabuy_schedule?.status === 'finished'">
                    <div v-if="invoiceLoading" class="space-y-2">
                        <USkeleton class="h-5 w-full" />
                        <USkeleton class="h-5 w-full" />
                        <USkeleton class="h-5 w-full" />
                    </div>
                    <UAlert
                        v-else-if="invoiceError"
                        color="error"
                        variant="subtle"
                        title="Failed to load invoice"
                        :description="invoiceError"
                    >
                        <template #actions>
                            <BaseButton size="xs" color="error" variant="soft" @click="loadInvoice(selectedOrder.uuid)">
                                Retry
                            </BaseButton>
                        </template>
                    </UAlert>
                    <InvoiceBreakdown v-else-if="invoice" :invoice="invoice" :order-items="selectedOrder.items" />
                </template>

                <template v-else>
                    <div class="divide-y divide-default rounded-lg border border-default">
                        <div v-for="item in selectedOrder.items" :key="item.uuid" class="p-3">
                            <OrderLineItem :item="item" />
                        </div>
                    </div>

                    <div class="flex items-center justify-between border-t border-default pt-3 font-medium text-highlighted">
                        <span>Total</span>
                        <span>₱{{ selectedOrder.total_amount }}</span>
                    </div>
                </template>

                <div v-if="selectedOrder.is_cancellable" class="flex items-center justify-end gap-2">
                    <CancelOrderControl :loading="cancellingOrder" @confirm="cancelSelectedOrder" />
                </div>
            </div>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'
import type { Invoice } from '@/types/Invoice'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

useHead({ title: 'My Orders' })

interface OrderItem {
    uuid: string
    product_uuid: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_out_of_stock: boolean
    quantity: number
    bonus_quantity: number
    subtotal: string
}

interface Order {
    uuid: string
    order_no: string
    status: 'pending' | 'confirmed' | 'cancelled'
    payment_status: 'unpaid' | 'partially_paid' | 'paid'
    delivery_status: 'not_delivered' | 'delivered'
    total_amount: string
    amount_paid: number
    amount_due: number
    is_editable: boolean
    is_cancellable: boolean
    pasabuy_schedule: { uuid: string; title: string; status: 'open' | 'closed' | 'finished' } | null
    items: OrderItem[]
    created_at: string
}

const { user } = useAuth()
const toast = useToast()
const orders = ref<Order[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = 15
const total = ref(0)
const search = ref('')
const statusFilter = ref<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
const paymentStatusFilter = ref('all')
const deliveryStatusFilter = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const isFiltersOpen = ref(false)

const statusFilterOptions = [
    { label: 'All statuses', value: 'all' },
    { label: customerOrderStatusLabel.pending, value: 'pending' },
    { label: customerOrderStatusLabel.confirmed, value: 'confirmed' },
    { label: customerOrderStatusLabel.cancelled, value: 'cancelled' }
]

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

const activeFilterCount = computed(() =>
    [statusFilter.value !== 'all', paymentStatusFilter.value !== 'all', deliveryStatusFilter.value !== 'all', !!dateFrom.value, !!dateTo.value]
        .filter(Boolean).length
)

function clearFilters() {
    statusFilter.value = 'all'
    paymentStatusFilter.value = 'all'
    deliveryStatusFilter.value = 'all'
    dateFrom.value = ''
    dateTo.value = ''
}

const columns: TableColumn<Order>[] = [
    { id: 'schedule', header: 'Pasabuy' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'payment_status', header: 'Payment' },
    { accessorKey: 'delivery_status', header: 'Delivery' },
    { accessorKey: 'created_at', header: 'Date' },
    { id: 'actions', header: '' }
]

function orderDisplayAmount(order: Order) {
    return order.pasabuy_schedule?.status === 'finished' ? order.amount_due : order.total_amount
}

const statusBreakdown = computed(() => [
    { label: 'Pending', count: orders.value.filter((o) => o.status === 'pending').length, dotClass: 'bg-warning' },
    { label: 'Confirmed', count: orders.value.filter((o) => o.status === 'confirmed').length, dotClass: 'bg-success' },
    { label: 'Cancelled', count: orders.value.filter((o) => o.status === 'cancelled').length, dotClass: 'bg-error' }
])

const attentionOrder = computed(() => {
    const candidates = orders.value.filter((o) => o.pasabuy_schedule?.status === 'finished' && o.amount_due > 0)
    if (candidates.length === 0) return null
    return candidates.reduce((highest, order) => (order.amount_due > highest.amount_due ? order : highest))
})

const emptyStateMessage = computed(() => {
    if (statusFilter.value !== 'all' || search.value || activeFilterCount.value) return 'No orders match this filter.'
    return "You haven't placed any orders yet."
})

async function loadOrders() {
    loading.value = true
    try {
        const response = await customerOrderService.fetchMyOrders({
            page: page.value,
            per_page: perPage,
            status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
            payment_status: paymentStatusFilter.value !== 'all' ? paymentStatusFilter.value : undefined,
            delivery_status: deliveryStatusFilter.value !== 'all' ? deliveryStatusFilter.value : undefined,
            date_from: dateFrom.value || undefined,
            date_to: dateTo.value || undefined,
            schedule_title: search.value || undefined
        })
        orders.value = response.data.items
        total.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load orders', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadOrders)

watch([statusFilter, paymentStatusFilter, deliveryStatusFilter, dateFrom, dateTo], () => {
    page.value = 1
    loadOrders()
})

useSearchDebounce(search, () => {
    page.value = 1
    loadOrders()
})

const isDetailOpen = ref(false)
const selectedOrder = ref<Order | null>(null)
const cancellingOrder = ref(false)
const invoice = ref<Invoice | null>(null)
const invoiceLoading = ref(false)
const invoiceError = ref('')

async function loadInvoice(orderUuid: string) {
    invoiceLoading.value = true
    invoiceError.value = ''
    try {
        const response = await customerOrderService.fetchInvoice(orderUuid)
        invoice.value = response.data
    } catch (error) {
        invoiceError.value = (error as APIError).message
    } finally {
        invoiceLoading.value = false
    }
}

function viewOrder(order: Order) {
    selectedOrder.value = order
    isDetailOpen.value = true
    invoice.value = null
    invoiceError.value = ''
    if (order.pasabuy_schedule?.status === 'finished') {
        loadInvoice(order.uuid)
    }
}

async function cancelSelectedOrder() {
    if (!selectedOrder.value) return
    cancellingOrder.value = true
    try {
        await customerOrderService.cancelOrder(selectedOrder.value.uuid)
        isDetailOpen.value = false
        toast.add({ title: 'Order cancelled', color: 'success' })
        await loadOrders()
    } catch (error) {
        toast.add({ title: 'Failed to cancel', description: (error as APIError).message, color: 'error' })
    } finally {
        cancellingOrder.value = false
    }
}

onMounted(loadOrders)
onPullToRefresh(loadOrders)
</script>
