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
                    <UBadge :color="orderStatusColor[row.original.status]" variant="subtle">
                        {{ row.original.status }}
                    </UBadge>
                </template>
                <template #created_at-cell="{ row }">
                    <span class="text-muted">{{ formatDate(row.original.created_at) }}</span>
                </template>
                <template #actions-cell="{ row }">
                    <UButton size="sm" color="neutral" variant="ghost" @click="viewOrder(row.original)">
                        View
                    </UButton>
                </template>
                <template #empty>
                    <div class="flex flex-col items-center gap-3 py-10">
                        <UIcon name="i-lucide-receipt" class="size-8 text-dimmed" />
                        <p class="text-sm text-muted">You haven't placed any orders yet.</p>
                    </div>
                </template>
            </UTable>
        </UCard>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>

        <UModal
            v-model:open="isDetailOpen"
            :title="selectedOrder?.pasabuy_schedule?.title ?? 'Order details'"
        >
            <template #body>
                <div v-if="selectedOrder" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <UBadge :color="orderStatusColor[selectedOrder.status]" variant="subtle">
                            {{ selectedOrder.status }}
                        </UBadge>
                        <span class="text-sm text-muted">{{ formatDate(selectedOrder.created_at) }}</span>
                    </div>

                    <div class="divide-y divide-default rounded-lg border border-default">
                        <div
                            v-for="item in selectedOrder.items"
                            :key="item.uuid"
                            class="flex items-center justify-between gap-3 p-3"
                        >
                            <div>
                                <div class="flex items-center gap-2">
                                    <p class="font-medium text-highlighted">{{ item.product_name }}</p>
                                    <UBadge v-if="item.is_bonus" color="success" variant="subtle" size="sm">FREE</UBadge>
                                    <UBadge v-else-if="item.confirmation_status === 'pending'" color="warning" variant="subtle" size="sm">
                                        Needs confirmation
                                    </UBadge>
                                    <UBadge v-else-if="item.confirmation_status === 'removed'" color="error" variant="subtle" size="sm">
                                        Removed
                                    </UBadge>
                                </div>
                                <p class="text-sm text-muted">₱{{ item.actual_price ?? item.estimated_price }} × {{ item.quantity }}</p>
                            </div>
                            <p class="font-medium text-highlighted">₱{{ item.subtotal }}</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between border-t border-default pt-3 font-medium text-highlighted">
                        <span>Total</span>
                        <span>₱{{ selectedOrder.total_amount }}</span>
                    </div>

                    <div v-if="selectedOrder.status === 'needs_confirmation'" class="text-sm text-muted">
                        This order has items waiting on your confirmation —
                        <NuxtLink
                            v-if="selectedOrder.pasabuy_schedule"
                            :to="`/pasabuy/${selectedOrder.pasabuy_schedule.uuid}`"
                            class="text-primary hover:underline"
                        >
                            review it on the pasabuy page
                        </NuxtLink>.
                    </div>

                    <div v-if="selectedOrder.is_cancellable" class="flex items-center justify-end gap-2">
                        <template v-if="!confirmingCancel">
                            <UButton color="error" variant="ghost" size="sm" @click="confirmingCancel = true">
                                Cancel order
                            </UButton>
                        </template>
                        <template v-else>
                            <span class="text-sm text-muted">Are you sure?</span>
                            <UButton color="error" size="sm" :loading="cancellingOrder" @click="cancelSelectedOrder">
                                Yes, cancel
                            </UButton>
                            <UButton color="neutral" variant="ghost" size="sm" @click="confirmingCancel = false">
                                No
                            </UButton>
                        </template>
                    </div>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

interface OrderItem {
    uuid: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_bonus: boolean
    confirmation_status: 'none' | 'pending' | 'accepted' | 'removed'
    quantity: number
    subtotal: string
}

interface Order {
    uuid: string
    status: 'pending' | 'needs_confirmation' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    is_cancellable: boolean
    needs_confirmation_count: number
    pasabuy_schedule: { uuid: string; title: string } | null
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

const orderStatusColor: Record<string, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending: 'neutral',
    needs_confirmation: 'warning',
    confirmed: 'success',
    cancelled: 'error'
}

const stats = computed(() => [
    { label: 'Total orders', value: total.value },
    { label: 'Pending', value: orders.value.filter((o) => o.status === 'pending').length },
    { label: 'Needs your input', value: orders.value.filter((o) => o.status === 'needs_confirmation').length },
    { label: 'Confirmed', value: orders.value.filter((o) => o.status === 'confirmed').length }
])

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

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
const confirmingCancel = ref(false)
const cancellingOrder = ref(false)

function viewOrder(order: Order) {
    selectedOrder.value = order
    confirmingCancel.value = false
    isDetailOpen.value = true
}

async function cancelSelectedOrder() {
    if (!selectedOrder.value) return
    cancellingOrder.value = true
    try {
        await customerOrderService.cancelOrder(selectedOrder.value.uuid)
        confirmingCancel.value = false
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
