<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Orders</h1>
        </div>

        <div class="space-y-3">
            <SearchInput v-model="search" placeholder="Search by customer name or contact…" class="w-full" />

            <div class="hidden sm:grid grid-cols-4 gap-2">
                <USelect v-model="scheduleFilter" :items="scheduleFilterOptions" value-key="value" class="w-full" />
                <USelect v-model="statusFilter" :items="statusFilterOptions" value-key="value" class="w-full" />
                <USelect v-model="paymentStatusFilter" :items="paymentStatusFilterOptions" value-key="value" class="w-full" />
                <USelect v-model="deliveryStatusFilter" :items="deliveryStatusFilterOptions" value-key="value" class="w-full" />
            </div>

            <UButton
                class="sm:hidden"
                color="neutral"
                variant="outline"
                icon="i-lucide-list-filter"
                @click="isFiltersOpen = true"
            >
                Filters
                <UBadge v-if="activeFilterCount" color="primary" variant="subtle" size="sm">{{ activeFilterCount }}</UBadge>
            </UButton>
        </div>

        <USlideover v-model:open="isFiltersOpen" side="bottom" title="Filters">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="Schedule">
                        <USelect v-model="scheduleFilter" :items="scheduleFilterOptions" value-key="value" class="w-full" />
                    </UFormField>
                    <UFormField label="Status">
                        <USelect v-model="statusFilter" :items="statusFilterOptions" value-key="value" class="w-full" />
                    </UFormField>
                    <UFormField label="Payment status">
                        <USelect v-model="paymentStatusFilter" :items="paymentStatusFilterOptions" value-key="value" class="w-full" />
                    </UFormField>
                    <UFormField label="Delivery status">
                        <USelect v-model="deliveryStatusFilter" :items="deliveryStatusFilterOptions" value-key="value" class="w-full" />
                    </UFormField>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center gap-2">
                    <UButton class="flex-1" color="neutral" variant="outline" @click="clearFilters">Clear filters</UButton>
                    <UButton class="flex-1" @click="isFiltersOpen = false">Done</UButton>
                </div>
            </template>
        </USlideover>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <div class="hidden sm:block">
                <UTable :data="orders" :columns="orderColumns" :loading="loading" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                    <template #customer-cell="{ row }">
                        <p class="font-medium text-highlighted">{{ row.original.customer_name }}</p>
                        <p class="text-sm text-muted">{{ row.original.customer_contact }}</p>
                    </template>
                    <template #schedule-cell="{ row }">
                        <NuxtLink
                            v-if="row.original.pasabuy_schedule"
                            :to="`/admin/schedules/${row.original.pasabuy_schedule.uuid}`"
                            class="text-primary hover:underline"
                        >
                            {{ row.original.pasabuy_schedule.title }}
                        </NuxtLink>
                        <span v-else class="text-muted">—</span>
                    </template>
                    <template #status-cell="{ row }">
                        <OrderStatusBadge :status="row.original.status" />
                    </template>
                    <template #payment_status-cell="{ row }">
                        <PaymentStatusBadge v-if="row.original.status === 'confirmed'" :status="row.original.payment_status" />
                        <span v-else class="text-muted">—</span>
                    </template>
                    <template #delivery_status-cell="{ row }">
                        <DeliveryStatusBadge v-if="row.original.status === 'confirmed'" :status="row.original.delivery_status" />
                        <span v-else class="text-muted">—</span>
                    </template>
                    <template #actions-cell="{ row }">
                        <div v-if="row.original.status === 'confirmed'" class="flex items-center justify-end gap-2">
                            <UButton
                                size="xs"
                                color="neutral"
                                variant="soft"
                                @click="toggleDeliveryStatus(row.original)"
                            >
                                {{ row.original.delivery_status === 'not_delivered' ? 'Mark delivered' : 'Mark not delivered' }}
                            </UButton>
                            <UButton
                                icon="i-lucide-wallet"
                                size="xs"
                                color="neutral"
                                variant="ghost"
                                aria-label="Manage payments"
                                @click="openPaymentsModal(row.original)"
                            />
                        </div>
                    </template>
                    <template #empty>
                        <TableEmptyState icon="i-lucide-receipt" message="No orders found." />
                    </template>
                </UTable>
            </div>
            <div class="sm:hidden divide-y divide-default">
                <ListCard v-for="order in orders" :key="order.uuid">
                    <template #title>
                        <p class="font-medium text-highlighted">{{ order.customer_name }}</p>
                        <OrderStatusBadge :status="order.status" />
                    </template>
                    <template #subtitle>
                        {{ order.customer_contact }}
                    </template>
                    <template #meta>
                        <span class="font-medium text-highlighted">₱{{ order.total_amount }}</span>
                        <NuxtLink
                            v-if="order.pasabuy_schedule"
                            :to="`/admin/schedules/${order.pasabuy_schedule.uuid}`"
                            class="text-primary hover:underline"
                        >
                            {{ order.pasabuy_schedule.title }}
                        </NuxtLink>
                        <div v-if="order.status === 'confirmed'" class="w-full flex items-center gap-2 mt-1.5">
                            <PaymentStatusBadge :status="order.payment_status" />
                            <DeliveryStatusBadge :status="order.delivery_status" />
                        </div>
                    </template>
                    <template v-if="order.status === 'confirmed'" #actions>
                        <UButton
                            :icon="order.delivery_status === 'not_delivered' ? 'i-lucide-truck' : 'i-lucide-package-check'"
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            :aria-label="order.delivery_status === 'not_delivered' ? 'Mark delivered' : 'Mark not delivered'"
                            @click="toggleDeliveryStatus(order)"
                        />
                        <UButton
                            icon="i-lucide-wallet"
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            aria-label="Manage payments"
                            @click="openPaymentsModal(order)"
                        />
                    </template>
                </ListCard>
                <TableEmptyState v-if="orders.length === 0" icon="i-lucide-receipt" message="No orders found." />
            </div>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <UModal
            v-model:open="isPaymentsModalOpen"
            :title="selectedOrder ? `${selectedOrder.customer_name}'s payments` : 'Payments'"
        >
            <template #body>
                <div v-if="selectedOrder" class="space-y-4">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-muted">Total</span>
                        <span class="font-medium text-highlighted">₱{{ selectedOrder.total_amount }}</span>
                    </div>

                    <div class="hidden sm:block">
                        <UTable :data="payments" :columns="paymentColumns" :loading="paymentsLoading">
                            <template #method-cell="{ row }">
                                <span class="capitalize">{{ row.original.method.replace('_', ' ') }}</span>
                            </template>
                            <template #paid_at-cell="{ row }">
                                {{ formatDate(row.original.paid_at) }}
                            </template>
                            <template #actions-cell="{ row }">
                                <UButton
                                    icon="i-lucide-trash-2"
                                    size="xs"
                                    color="error"
                                    variant="ghost"
                                    aria-label="Delete payment"
                                    @click="deletePayment(row.original)"
                                />
                            </template>
                            <template #empty>
                                <TableEmptyState icon="i-lucide-wallet" message="No payments recorded yet." padding="py-6" />
                            </template>
                        </UTable>
                    </div>
                    <div class="sm:hidden divide-y divide-default">
                        <ListCard v-for="payment in payments" :key="payment.uuid">
                            <template #title>
                                <p class="font-medium text-highlighted">₱{{ payment.amount }}</p>
                            </template>
                            <template #subtitle>
                                <span class="capitalize">{{ payment.method.replace('_', ' ') }}</span> · {{ formatDate(payment.paid_at) }}
                            </template>
                            <template #actions>
                                <UButton
                                    icon="i-lucide-trash-2"
                                    size="sm"
                                    color="error"
                                    variant="ghost"
                                    aria-label="Delete payment"
                                    @click="deletePayment(payment)"
                                />
                            </template>
                        </ListCard>
                        <TableEmptyState v-if="payments.length === 0" icon="i-lucide-wallet" message="No payments recorded yet." padding="py-6" />
                    </div>

                    <form class="space-y-3 border-t border-default pt-4" @submit.prevent="submitPayment">
                        <div class="grid grid-cols-2 gap-3">
                            <UFormField label="Amount" required>
                                <UInput v-model.number="paymentForm.amount" type="number" inputmode="decimal" min="0.01" step="0.01" class="w-full">
                                    <template #leading>
                                        <span class="text-sm text-dimmed">₱</span>
                                    </template>
                                </UInput>
                            </UFormField>
                            <UFormField label="Method" required>
                                <USelect v-model="paymentForm.method" :items="paymentMethodOptions" value-key="value" class="w-full" />
                            </UFormField>
                        </div>
                        <UFormField label="Paid on" required>
                            <UInput v-model="paymentForm.paid_at" type="date" required class="w-full" />
                        </UFormField>
                        <UFormField label="Reference number">
                            <UInput v-model="paymentForm.reference_number" class="w-full" />
                        </UFormField>
                        <UFormField label="Notes">
                            <UTextarea v-model="paymentForm.notes" class="w-full" />
                        </UFormField>
                        <UButton type="submit" block :loading="recordingPayment">Record payment</UButton>
                    </form>
                </div>
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
import { orderService } from '@/components/api/admin/OrderService'
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { Order } from '@/types/Order'
import type { OrderPayment } from '@/types/OrderPayment'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

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
const schedules = ref<ScheduleOption[]>([])
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
    ...schedules.value.map((schedule) => ({ label: schedule.title, value: schedule.uuid }))
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

const orderColumns: TableColumn<Order>[] = [
    { id: 'customer', header: 'Customer' },
    { id: 'schedule', header: 'Schedule' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'payment_status', header: 'Payment' },
    { accessorKey: 'delivery_status', header: 'Delivery' },
    { id: 'actions', header: '' }
]

async function loadSchedules() {
    try {
        const response = await pasabuyScheduleService.fetchSchedules({ per_page: 100 })
        schedules.value = response.data.data
    } catch (error) {
        toast.add({ title: 'Failed to load schedules', description: (error as APIError).message, color: 'error' })
    }
}

async function loadOrders() {
    loading.value = true
    try {
        const response = await orderService.fetchOrders({
            page: page.value,
            per_page: perPage,
            search: search.value || undefined,
            status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
            schedule_uuid: scheduleFilter.value !== 'all' ? scheduleFilter.value : undefined,
            payment_status: paymentStatusFilter.value !== 'all' ? paymentStatusFilter.value : undefined,
            delivery_status: deliveryStatusFilter.value !== 'all' ? deliveryStatusFilter.value : undefined
        })
        orders.value = response.data.data
        total.value = response.data.total
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
        toast.add({ title: `Order marked as ${deliveryStatusLabel[response.data.delivery_status]!.toLowerCase()}`, color: 'success' })
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

const isPaymentsModalOpen = ref(false)
const selectedOrder = ref<Order | null>(null)
const payments = ref<OrderPayment[]>([])
const paymentsLoading = ref(false)
const recordingPayment = ref(false)

const paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'GCash', value: 'gcash' },
    { label: 'Bank transfer', value: 'bank_transfer' },
    { label: 'Maya', value: 'maya' },
    { label: 'Other', value: 'other' }
]

const paymentColumns: TableColumn<OrderPayment>[] = [
    { accessorKey: 'amount', header: 'Amount' },
    { id: 'method', header: 'Method' },
    { id: 'paid_at', header: 'Paid on' },
    { accessorKey: 'reference_number', header: 'Reference' },
    { id: 'actions', header: '' }
]

const paymentForm = reactive({
    amount: null as number | null,
    method: 'cash' as 'cash' | 'gcash' | 'bank_transfer' | 'maya' | 'other',
    reference_number: '',
    notes: '',
    paid_at: ''
})

function resetPaymentForm() {
    paymentForm.amount = null
    paymentForm.method = 'cash'
    paymentForm.reference_number = ''
    paymentForm.notes = ''
    paymentForm.paid_at = new Date().toISOString().slice(0, 10)
}

async function loadPayments(orderUuid: string) {
    paymentsLoading.value = true
    try {
        const response = await orderService.fetchPayments(orderUuid)
        payments.value = response.data
    } catch (error) {
        toast.add({ title: 'Failed to load payments', description: (error as APIError).message, color: 'error' })
    } finally {
        paymentsLoading.value = false
    }
}

async function openPaymentsModal(order: Order) {
    selectedOrder.value = order
    resetPaymentForm()
    isPaymentsModalOpen.value = true
    await loadPayments(order.uuid)
}

async function submitPayment() {
    if (!selectedOrder.value || !paymentForm.amount || !paymentForm.paid_at) {
        toast.add({ title: 'Amount and paid date are required', color: 'error' })
        return
    }

    recordingPayment.value = true
    try {
        await orderService.recordPayment(selectedOrder.value.uuid, {
            amount: paymentForm.amount,
            method: paymentForm.method,
            reference_number: paymentForm.reference_number || undefined,
            notes: paymentForm.notes || undefined,
            paid_at: paymentForm.paid_at
        })
        resetPaymentForm()
        toast.add({ title: 'Payment recorded', color: 'success' })
        await Promise.all([loadPayments(selectedOrder.value.uuid), loadOrders()])
    } catch (error) {
        toast.add({ title: 'Failed to record payment', description: (error as APIError).message, color: 'error' })
    } finally {
        recordingPayment.value = false
    }
}

function deletePayment(payment: OrderPayment) {
    if (!selectedOrder.value) return
    const order = selectedOrder.value

    askConfirm({
        title: 'Remove payment?',
        description: `Remove the ₱${payment.amount} payment recorded on ${formatDate(payment.paid_at)}?`,
        confirmLabel: 'Remove',
        color: 'error',
        action: async () => {
            try {
                await orderService.deletePayment(order.uuid, payment.uuid)
                toast.add({ title: 'Payment removed', color: 'success' })
                await Promise.all([loadPayments(order.uuid), loadOrders()])
            } catch (error) {
                toast.add({ title: 'Failed to remove payment', description: (error as APIError).message, color: 'error' })
            }
        }
    })
}

onMounted(() => {
    loadOrders()
    loadSchedules()
})
</script>
