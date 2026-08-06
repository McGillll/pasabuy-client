<template>
    <div class="space-y-6">
        <div class="hidden items-center gap-2 md:flex">
            <IconOrders class="size-5 text-primary" />
            <h1 class="text-xl font-semibold text-highlighted">Order</h1>
        </div>

        <KpiCard
            :icon="owedTotal > 0 ? 'i-lucide-circle-alert' : 'i-lucide-circle-check'"
            :color="owedTotal > 0 ? 'error' : 'success'"
            :label="owedTotal > 0 ? 'Balance due' : 'All settled'"
            :value="owedTotal > 0 ? currency(owedTotal) : currency(paidTotal)"
            :delta="owedDelta"
            :loading="loading"
        />

        <div class="sticky top-0 z-10 -mx-4 space-y-2 bg-default/95 px-4 py-2 backdrop-blur-sm">
            <div class="flex items-center gap-2">
                <div class="flex shrink-0 items-center gap-1 rounded-lg ring-1 ring-default">
                    <BaseButton
                        icon="i-lucide-chevron-left"
                        size="sm"
                        color="neutral"
                        variant="ghost"
                        class="min-h-11 min-w-11"
                        aria-label="Previous year"
                        @click="year -= 1"
                    />
                    <span class="min-w-12 text-center font-mono text-sm font-semibold tabular-nums text-highlighted">{{ year }}</span>
                    <BaseButton
                        icon="i-lucide-chevron-right"
                        size="sm"
                        color="neutral"
                        variant="ghost"
                        class="min-h-11 min-w-11"
                        aria-label="Next year"
                        :disabled="year >= currentYear"
                        @click="year += 1"
                    />
                </div>
                <BaseButton
                    icon="i-lucide-list-filter"
                    size="sm"
                    color="neutral"
                    :variant="statusFilter === 'all' ? 'outline' : 'subtle'"
                    class="min-h-11 min-w-11 shrink-0"
                    :aria-label="statusFilter === 'all' ? 'Filter by status' : `Filter by status, currently ${statusFilterItems.find((i) => i.value === statusFilter)?.label}`"
                    @click="isStatusFilterOpen = true"
                />
            </div>
        </div>

        <USlideover v-model:open="isStatusFilterOpen" side="bottom" title="Filter by status">
            <template #body>
                <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Filter by status">
                    <button
                        v-for="item in statusFilterItems"
                        :key="item.value"
                        type="button"
                        role="radio"
                        :aria-checked="statusFilter === item.value"
                        class="flex min-h-11 items-center justify-between rounded-lg px-3 text-left text-sm font-medium ring-1 ring-default transition-colors"
                        :class="statusFilter === item.value ? 'bg-primary/10 text-primary ring-primary' : 'text-muted hover:text-highlighted'"
                        @click="selectStatusFilter(item.value)"
                    >
                        {{ item.label }}
                        <UIcon v-if="statusFilter === item.value" name="i-lucide-check" class="size-4" />
                    </button>
                </div>
            </template>
        </USlideover>

        <BaseButton
            v-if="priorityOrder"
            block
            :color="priorityOrder.is_overdue ? 'error' : 'warning'"
            variant="soft"
            :icon="priorityOrder.is_overdue ? 'i-lucide-alarm-clock' : 'i-lucide-wallet'"
            class="-mt-2 justify-start"
            @click="viewOrder(priorityOrder)"
        >
            <span class="flex flex-col items-start text-left">
                <span class="text-xs font-medium">{{ priorityOrder.is_overdue ? 'Oldest overdue balance' : 'Oldest unpaid balance' }} &middot; all statuses</span>
                <span class="text-sm font-semibold">
                    {{ priorityOrder.pasabuy_schedule?.title }} &middot; <span class="font-mono tabular-nums">₱{{ currency(priorityOrder.amount_due) }}</span>
                </span>
            </span>
        </BaseButton>

        <template v-if="loading">
            <div class="space-y-3">
                <USkeleton v-for="n in 3" :key="n" class="h-24 w-full rounded-xl" />
            </div>
        </template>

        <template v-else-if="ordersError">
            <UAlert
                color="error"
                variant="subtle"
                title="Failed to load orders"
                :description="ordersError"
            >
                <template #actions>
                    <BaseButton size="xs" color="error" variant="soft" @click="loadOrders">
                        Retry
                    </BaseButton>
                </template>
            </UAlert>
        </template>

        <template v-else-if="!scopedOrders.length">
            <BaseEmptyState icon="i-lucide-inbox" :message="emptyStateTitle" :description="emptyStateMessage" />
        </template>

        <template v-else>
            <template v-for="key in GROUP_ORDER" :key="key">
                <div v-if="groups[key].length" class="space-y-2">
                    <button
                        type="button"
                        class="flex w-full items-baseline justify-between gap-3 px-1 text-left"
                        :aria-expanded="expandedGroups[key]"
                        :aria-controls="`group-${key}`"
                        @click="expandedGroups[key] = !expandedGroups[key]"
                    >
                        <span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-dimmed">
                            <UIcon name="i-lucide-chevron-right" class="size-3.5 transition-transform" :class="expandedGroups[key] ? 'rotate-90' : ''" />
                            <UIcon :name="GROUP_META[key].icon" class="size-3.5" />
                            {{ GROUP_META[key].label }}
                            <span class="font-mono tabular-nums">{{ groups[key].length }}</span>
                        </span>
                        <span v-if="groupTotal(key) !== null" class="font-mono text-sm font-semibold tabular-nums" :class="GROUP_TEXT_CLASSES[key]">
                            ₱{{ currency(groupTotal(key)!) }}
                        </span>
                    </button>

                    <div v-if="expandedGroups[key]" :id="`group-${key}`" class="space-y-2">
                        <ListCard v-for="order in groups[key]" :key="order.uuid" clickable @click="viewOrder(order)">
                            <template #title>
                                <span v-if="order.pasabuy_schedule" class="font-medium text-highlighted">{{ order.pasabuy_schedule.title }}</span>
                            </template>
                            <template #subtitle>
                                <span class="font-mono text-xs">{{ order.order_no }}</span>
                                <span v-if="groupSubtext(key, order)"> &middot; {{ groupSubtext(key, order) }}</span>
                            </template>
                            <template #meta>
                                <span v-if="key === 'overdue' || key === 'unpaid'" class="flex items-baseline gap-1">
                                    <span class="text-xs text-dimmed">Due</span>
                                    <span class="font-mono tabular-nums font-medium" :class="GROUP_TEXT_CLASSES[key]">₱{{ currency(order.amount_due) }}</span>
                                </span>
                                <span v-else-if="key === 'paid'" class="flex items-baseline gap-1">
                                    <span class="text-xs text-dimmed">Paid</span>
                                    <span class="font-mono tabular-nums font-medium" :class="GROUP_TEXT_CLASSES[key]">₱{{ currency(order.amount_paid) }}</span>
                                </span>
                                <span v-else-if="key === 'cancelled'" class="flex items-baseline gap-1">
                                    <span class="text-xs text-dimmed">Total</span>
                                    <span class="font-mono tabular-nums text-muted">₱{{ currency(Number(order.total_amount)) }}</span>
                                </span>
                            </template>
                        </ListCard>
                    </div>
                </div>
            </template>
        </template>

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
                        <span class="font-mono tabular-nums">₱{{ selectedOrder.total_amount }}</span>
                    </div>
                </template>

                <div v-if="selectedOrder.is_cancellable" class="flex items-center justify-end gap-2">
                    <CancelOrderControl
                        :loading="cancellingOrder"
                        :order-title="selectedOrder?.pasabuy_schedule?.title"
                        :order-total="selectedOrder?.total_amount"
                        @confirm="cancelSelectedOrder"
                    />
                </div>
            </div>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'
import type { Invoice } from '@/types/Invoice'

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
    due_date: string | null
    is_overdue: boolean | null
    is_editable: boolean
    is_cancellable: boolean
    pasabuy_schedule: { uuid: string; title: string; status: 'open' | 'closed' | 'finished' } | null
    items: OrderItem[]
    created_at: string
}

type PaymentGroupKey = 'overdue' | 'unpaid' | 'awaiting' | 'paid' | 'cancelled'

const GROUP_ORDER: PaymentGroupKey[] = ['overdue', 'unpaid', 'awaiting', 'paid', 'cancelled']

const GROUP_META: Record<PaymentGroupKey, { label: string; icon: string }> = {
    overdue: { label: 'Overdue', icon: 'i-lucide-alarm-clock' },
    unpaid: { label: 'Unpaid', icon: 'i-lucide-wallet' },
    awaiting: { label: 'Awaiting confirmation', icon: 'i-lucide-clock' },
    paid: { label: 'Paid', icon: 'i-lucide-circle-check' },
    cancelled: { label: 'Cancelled', icon: 'i-lucide-ban' }
}

// Literal Tailwind classes per group (written out per-key, not built from a template string,
// so Tailwind's scanner can see them). Color now lives only on the section total figure and
// each row's own amount, not repeated across an icon tile + label + count + total.
const GROUP_TEXT_CLASSES: Record<PaymentGroupKey, string> = {
    overdue: 'text-error',
    unpaid: 'text-warning',
    awaiting: 'text-muted',
    paid: 'text-success',
    cancelled: 'text-muted'
}

const DEFAULT_EXPANDED: Record<PaymentGroupKey, boolean> = {
    overdue: true,
    unpaid: true,
    awaiting: false,
    paid: false,
    cancelled: false
}

type LifecycleStatusFilter = 'all' | 'pending' | 'confirmed' | 'cancelled'

const toast = useToast()
const orders = ref<Order[]>([])
const loading = ref(false)
const ordersError = ref('')
const expandedGroups = reactive<Record<PaymentGroupKey, boolean>>({ ...DEFAULT_EXPANDED })
const statusFilter = ref<LifecycleStatusFilter>('all')
const isStatusFilterOpen = ref(false)

function selectStatusFilter(value: LifecycleStatusFilter) {
    statusFilter.value = value
    isStatusFilterOpen.value = false
}

const currentYear = new Date().getFullYear()
const year = ref(currentYear)

const statusFilterItems: { label: string; value: LifecycleStatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: customerOrderStatusLabel.pending, value: 'pending' },
    { label: customerOrderStatusLabel.confirmed, value: 'confirmed' },
    { label: customerOrderStatusLabel.cancelled, value: 'cancelled' }
]

function currency(value: number) {
    return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function bucketFor(order: Order): PaymentGroupKey {
    if (order.status === 'cancelled') return 'cancelled'
    if (order.status === 'pending') return 'awaiting'
    if (order.is_overdue) return 'overdue'
    if (order.payment_status !== 'paid') return 'unpaid'
    return 'paid'
}

function bucketize(list: Order[]) {
    const buckets: Record<PaymentGroupKey, Order[]> = { overdue: [], unpaid: [], awaiting: [], paid: [], cancelled: [] }
    for (const order of list) buckets[bucketFor(order)].push(order)
    return buckets
}

function totalFor(list: Order[], key: PaymentGroupKey): number | null {
    if (key === 'awaiting' || key === 'cancelled') return null
    if (key === 'paid') return list.reduce((sum, order) => sum + Number(order.amount_paid), 0)
    return list.reduce((sum, order) => sum + Number(order.amount_due), 0)
}

/**
 * The visible list respects the lifecycle-status filter; the KPI balance and the "settle"
 * shortcut do not — a customer filtering to "Pending" or "Cancelled" must still see their true
 * year-to-date balance, not a figure that reads "All settled" just because the current filter
 * happens to hide every unpaid order.
 */
const scopedOrders = computed(() => {
    if (statusFilter.value === 'all') return orders.value.filter((order) => order.status !== 'cancelled')
    return orders.value.filter((order) => order.status === statusFilter.value)
})

const groups = computed(() => bucketize(scopedOrders.value))

const allGroups = computed(() => bucketize(orders.value.filter((order) => order.status !== 'cancelled')))

function groupTotal(key: PaymentGroupKey): number | null {
    return totalFor(groups.value[key], key)
}

function daysBetween(dateStr: string) {
    const due = new Date(dateStr)
    const now = new Date()
    return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

function groupSubtext(key: PaymentGroupKey, order: Order) {
    if (key === 'overdue' && order.due_date) {
        const days = daysBetween(order.due_date)
        return `${days} day${days === 1 ? '' : 's'} overdue`
    }
    if (key === 'unpaid' && order.due_date) {
        const days = -daysBetween(order.due_date)
        return days > 0 ? `Due in ${days} day${days === 1 ? '' : 's'}` : `Due ${formatDate(order.due_date)}`
    }
    if (key === 'awaiting') return "Seller hasn't confirmed pricing yet"
    return null
}

const owedTotal = computed(() => (totalFor(allGroups.value.overdue, 'overdue') ?? 0) + (totalFor(allGroups.value.unpaid, 'unpaid') ?? 0))
const owedCount = computed(() => allGroups.value.overdue.length + allGroups.value.unpaid.length)
const paidTotal = computed(() => totalFor(allGroups.value.paid, 'paid') ?? 0)

const owedDelta = computed(() => {
    const parts: string[] = []
    if (owedCount.value > 0) parts.push(`${owedCount.value} unsettled`)
    if (allGroups.value.paid.length > 0) parts.push(`${allGroups.value.paid.length} paid this year`)
    return parts.length ? parts.join(' · ') : undefined
})

function byOldestDueDate(a: Order, b: Order) {
    return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
}

function byOldestCreated(a: Order, b: Order) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

const priorityOrder = computed(() => {
    const candidates = [...allGroups.value.overdue, ...allGroups.value.unpaid]
    if (!candidates.length) return null

    // A missing due_date is not "infinitely old" — exclude those from the date sort so they can't
    // silently outrank a genuinely older dated balance, then fall back to oldest-placed among them.
    const dated = candidates.filter((order) => order.due_date).sort(byOldestDueDate)
    if (dated.length) return dated[0]

    return [...candidates].sort(byOldestCreated)[0] ?? null
})

const hasActiveFilters = computed(() => statusFilter.value !== 'all')

const emptyStateTitle = computed(() => (hasActiveFilters.value ? 'No orders match this filter' : `No orders in ${year.value}`))

const emptyStateMessage = computed(() => {
    if (hasActiveFilters.value) return 'Try a different filter.'
    return "When you join a pasabuy run, your orders and their status will show up here."
})

async function loadOrders() {
    loading.value = true
    ordersError.value = ''
    try {
        const response = await customerOrderService.fetchMyOrders({
            per_page: 50,
            date_from: `${year.value}-01-01`,
            date_to: `${year.value}-12-31`
        })
        orders.value = response.data.items
    } catch (error) {
        ordersError.value = (error as APIError).message
    } finally {
        loading.value = false
    }
}

watch(year, loadOrders)

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
