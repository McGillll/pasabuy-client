<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">My Orders</h1>
            <p class="mt-1 text-sm text-muted">A history of every pasabuy order you've placed.</p>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <UCard v-for="stat in stats" :key="stat.label">
                <p class="text-xs text-muted">{{ stat.label }}</p>
                <p class="text-2xl font-semibold text-highlighted">{{ stat.value }}</p>
            </UCard>
        </div>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <div class="hidden sm:block">
                <UTable
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
                    </template>
                    <template #status-cell="{ row }">
                        <OrderStatusBadge :status="row.original.status" />
                    </template>
                    <template #created_at-cell="{ row }">
                        <span class="text-muted">{{ formatDate(row.original.created_at) }}</span>
                    </template>
                    <template #actions-cell="{ row }">
                        <BaseButton size="sm" color="neutral" variant="ghost" @click="viewOrder(row.original)">
                            View
                        </BaseButton>
                    </template>
                    <template #empty>
                        <div class="flex flex-col items-center gap-3 py-10">
                            <UIcon name="i-lucide-receipt" class="size-8 text-dimmed" />
                            <p class="text-sm text-muted">You haven't placed any orders yet.</p>
                        </div>
                    </template>
                </UTable>
            </div>
            <div class="sm:hidden space-y-2 p-2">
                <ListCard v-for="order in orders" :key="order.uuid" clickable @click="viewOrder(order)">
                    <template #title>
                        <span v-if="order.pasabuy_schedule" class="font-medium text-highlighted">
                            {{ order.pasabuy_schedule.title }}
                        </span>
                    </template>
                    <template #meta>
                        <span class="font-medium text-highlighted">₱{{ order.total_amount }}</span>
                        <span class="text-muted">{{ formatDate(order.created_at) }}</span>
                    </template>
                    <template #status>
                        <OrderStatusBadge :status="order.status" />
                    </template>
                </ListCard>
                <div v-if="orders.length === 0" class="flex flex-col items-center gap-3 py-10">
                    <UIcon name="i-lucide-receipt" class="size-8 text-dimmed" />
                    <p class="text-sm text-muted">You haven't placed any orders yet.</p>
                </div>
            </div>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <BaseModal
            v-model:open="isDetailOpen"
            :title="selectedOrder?.pasabuy_schedule?.title ?? 'Order details'"
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
                    <InvoiceBreakdown v-else-if="invoice" :invoice="invoice" />
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

useHead({ title: 'Dashboard' })

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
    status: 'pending' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    is_cancellable: boolean
    pasabuy_schedule: { uuid: string; title: string; status: 'open' | 'closed' | 'finished' } | null
    items: OrderItem[]
    created_at: string
}

const toast = useToast()
const orders = ref<Order[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = 15
const total = ref(0)

const columns: TableColumn<Order>[] = [
    { id: 'schedule', header: 'Pasabuy' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'created_at', header: 'Date' },
    { id: 'actions', header: '' }
]

const stats = computed(() => [
    { label: 'Total orders', value: total.value },
    { label: 'Pending', value: orders.value.filter((o) => o.status === 'pending').length },
    { label: 'Confirmed', value: orders.value.filter((o) => o.status === 'confirmed').length },
    { label: 'Cancelled', value: orders.value.filter((o) => o.status === 'cancelled').length }
])

async function loadOrders() {
    loading.value = true
    try {
        const response = await customerOrderService.fetchMyOrders({ page: page.value, per_page: perPage })
        orders.value = response.data.data
        total.value = response.data.total
    } catch (error) {
        toast.add({ title: 'Failed to load orders', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

watch(page, loadOrders)

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
</script>
