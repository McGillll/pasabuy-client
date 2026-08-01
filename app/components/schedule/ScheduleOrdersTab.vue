<template>
    <div class="mt-4">
        <EntityFilterBar
            v-model="workspace.orderSearch"
            placeholder="Search by customer name, contact, or order no…"
            :show-filter-button="true"
            :filter-count="workspace.orderActiveFilterCount"
            @filter-click="isOrderFiltersOpen = true"
        >
            <template #inline>
                <div class="hidden sm:flex items-center gap-2">
                    <BaseSelect
                        v-model="workspace.orderStatusFilter"
                        :items="orderStatusChipOptions"
                        icon="i-lucide-list-filter"
                        class="w-36"
                        :ui="{ base: 'h-11' }"
                    />
                    <BaseSelect
                        v-model="workspace.orderPaymentStatusFilter"
                        :items="orderPaymentStatusChipOptions"
                        icon="i-lucide-wallet"
                        class="w-40"
                        :ui="{ base: 'h-11' }"
                    />
                    <BaseSelect
                        v-model="workspace.orderDeliveryStatusFilter"
                        :items="orderDeliveryStatusChipOptions"
                        icon="i-lucide-truck"
                        class="w-40"
                        :ui="{ base: 'h-11' }"
                    />
                </div>
            </template>
        </EntityFilterBar>

        <USlideover v-model:open="isOrderFiltersOpen" side="bottom" title="Filters">
            <template #body>
                <div class="space-y-4">
                    <BaseFormField label="Status">
                        <BaseChipGroup v-model="workspace.orderStatusFilter" :items="orderStatusChipOptions" />
                    </BaseFormField>
                    <BaseFormField label="Payment status">
                        <BaseChipGroup v-model="workspace.orderPaymentStatusFilter" :items="orderPaymentStatusChipOptions" />
                    </BaseFormField>
                    <BaseFormField label="Delivery status">
                        <BaseChipGroup v-model="workspace.orderDeliveryStatusFilter" :items="orderDeliveryStatusChipOptions" />
                    </BaseFormField>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center gap-2">
                    <BaseButton class="flex-1" color="neutral" variant="outline" @click="workspace.clearOrderFilters">Clear filters</BaseButton>
                    <BaseButton class="flex-1" @click="isOrderFiltersOpen = false">Done</BaseButton>
                </div>
            </template>
        </USlideover>

        <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
            <BaseTable :data="pagedOrders" :columns="orderColumns" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                <template #customer_name-cell="{ row }">
                    <p class="font-medium text-highlighted">{{ row.original.customer_name }}</p>
                    <p class="text-xs text-dimmed">{{ row.original.customer_contact }} · <span class="font-mono">{{ row.original.order_no }}</span></p>
                </template>
                <template #status-cell="{ row }">
                    <OrderStatusBadge :status="row.original.status" />
                </template>
                <template #fulfillment-cell="{ row }">
                    <div v-if="row.original.status === 'confirmed'" class="flex items-center gap-1.5">
                        <PaymentStatusBadge :status="row.original.payment_status" />
                        <DeliveryStatusBadge :status="row.original.delivery_status" />
                    </div>
                    <span v-else class="text-muted">-</span>
                </template>
                <template #total_amount-cell="{ row }">
                    {{ workspace.orderDisplayAmount(row.original) }}
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-1">
                        <template v-if="row.original.status === 'pending'">
                            <BaseButton
                                icon="i-lucide-check"
                                size="sm"
                                color="success"
                                variant="ghost"
                                :disabled="!workspace.isClosed"
                                :aria-label="workspace.isClosed ? 'Confirm order' : 'Close schedule to confirm'"
                                @click="workspace.confirmOrder(row.original)"
                            />
                            <BaseButton
                                icon="i-lucide-x"
                                size="sm"
                                color="error"
                                variant="ghost"
                                aria-label="Cancel order"
                                @click="workspace.cancelOrder(row.original)"
                            />
                        </template>
                        <template v-else-if="row.original.status === 'confirmed'">
                            <BaseButton
                                icon="i-lucide-truck"
                                size="sm"
                                color="neutral"
                                variant="ghost"
                                :aria-label="row.original.delivery_status === 'not_delivered' ? 'Mark delivered' : 'Mark not delivered'"
                                @click="workspace.toggleDeliveryStatus(row.original)"
                            />
                            <BaseButton
                                icon="i-lucide-wallet"
                                size="sm"
                                color="neutral"
                                variant="ghost"
                                aria-label="Manage payment"
                                @click="openPaymentsModal(row.original)"
                            />
                        </template>
                        <BaseButton
                            icon="i-lucide-eye"
                            size="sm"
                            color="neutral"
                            variant="ghost"
                            aria-label="View order"
                            @click="workspace.viewOrder(row.original)"
                        />
                    </div>
                </template>
                <template #list-item="{ item: order }">
                    <div>
                        <ListCard
                            clickable
                            @click="workspace.viewOrder(order)"
                        >
                            <template #title>
                                <p class="font-medium text-highlighted">{{ order.customer_name }}</p>
                            </template>
                            <template #subtitle>
                                {{ order.customer_contact }} · <span class="font-mono text-xs">{{ order.order_no }}</span>
                            </template>
                            <template #meta>
                                <span class="font-medium text-highlighted">₱{{ workspace.orderDisplayAmount(order) }}</span>
                            </template>
                            <template #status>
                                <OrderStatusBadge :status="order.status" />
                                <template v-if="order.status === 'confirmed'">
                                    <PaymentStatusBadge :status="order.payment_status" />
                                    <DeliveryStatusBadge :status="order.delivery_status" />
                                </template>
                            </template>
                            <template v-if="order.status === 'pending' || order.status === 'confirmed'" #trailing>
                                <ListCardButton
                                    icon="i-lucide-ellipsis-vertical"
                                    aria-label="Order actions"
                                    @click.stop="toggleExpanded(order.uuid)"
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
                            <div v-if="expandedOrderUuid === order.uuid" class="overflow-hidden">
                                <div v-if="order.status === 'pending'" class="mt-2 flex items-center gap-2 rounded-lg bg-elevated p-2 ring-1 ring-default">
                                    <BaseButton
                                        v-if="workspace.isClosed"
                                        class="flex-1"
                                        color="success"
                                        @click="workspace.confirmOrder(order); expandedOrderUuid = null"
                                    >
                                        Confirm order
                                    </BaseButton>
                                    <span v-else class="flex-1 text-center text-xs text-dimmed">Close schedule to confirm</span>
                                    <BaseButton
                                        class="flex-1"
                                        color="error"
                                        variant="outline"
                                        @click="workspace.cancelOrder(order); expandedOrderUuid = null"
                                    >
                                        Cancel order
                                    </BaseButton>
                                </div>
                                <div v-else class="mt-2 flex items-center gap-2 rounded-lg bg-elevated p-2 ring-1 ring-default">
                                    <BaseButton
                                        class="flex-1"
                                        color="neutral"
                                        variant="soft"
                                        @click="workspace.toggleDeliveryStatus(order); expandedOrderUuid = null"
                                    >
                                        {{ order.delivery_status === 'not_delivered' ? 'Mark delivered' : 'Mark not delivered' }}
                                    </BaseButton>
                                    <BaseButton
                                        class="flex-1"
                                        color="neutral"
                                        variant="outline"
                                        icon="i-lucide-wallet"
                                        @click="openPaymentsModal(order); expandedOrderUuid = null"
                                    >
                                        Manage payment
                                    </BaseButton>
                                </div>
                            </div>
                        </Transition>
                    </div>
                </template>
                <template #empty>
                    <BaseEmptyState icon="i-lucide-receipt" :message="workspace.orders.length === 0 ? 'No orders yet.' : 'No orders match your search.'" />
                </template>
            </BaseTable>
        </UCard>

        <div v-if="workspace.filteredOrders.length > orderPerPage" class="mt-4 flex justify-center">
            <UPagination v-model:page="orderPage" :total="workspace.filteredOrders.length" :items-per-page="orderPerPage" />
        </div>

        <OrderPaymentsModal
            v-model:open="isPaymentsModalOpen"
            :order="selectedOrderForPayments"
            @updated="workspace.refreshOrders"
        />
    </div>
</template>

<script setup lang="ts">
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'
import type { Order } from '@/types/Order'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
    workspace: ScheduleWorkspace
}>()

const isOrderFiltersOpen = ref(false)
const expandedOrderUuid = ref<string | null>(null)

function toggleExpanded(uuid: string) {
    expandedOrderUuid.value = expandedOrderUuid.value === uuid ? null : uuid
}

const isPaymentsModalOpen = ref(false)
const selectedOrderForPayments = ref<Order | null>(null)

function openPaymentsModal(order: Order) {
    selectedOrderForPayments.value = order
    isPaymentsModalOpen.value = true
}

const orderStatusChipOptions = [
    { label: 'All', value: 'all' },
    { label: customerOrderStatusLabel.pending, value: 'pending' },
    { label: customerOrderStatusLabel.confirmed, value: 'confirmed' },
    { label: customerOrderStatusLabel.cancelled, value: 'cancelled' }
]

const orderPaymentStatusChipOptions = [
    { label: 'All', value: 'all' },
    { label: paymentStatusLabel.unpaid, value: 'unpaid' },
    { label: paymentStatusLabel.partially_paid, value: 'partially_paid' },
    { label: paymentStatusLabel.paid, value: 'paid' }
]

const orderDeliveryStatusChipOptions = [
    { label: 'All', value: 'all' },
    { label: deliveryStatusLabel.not_delivered, value: 'not_delivered' },
    { label: deliveryStatusLabel.delivered, value: 'delivered' }
]

const orderColumns: TableColumn<Order>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { id: 'fulfillment', header: 'Fulfillment' },
    { id: 'actions', header: '' }
]


const orderPerPage = 15
const orderPage = ref(1)
const pagedOrders = computed(() => {
    const start = (orderPage.value - 1) * orderPerPage
    return props.workspace.filteredOrders.slice(start, start + orderPerPage)
})

watch(() => props.workspace.filteredOrders, () => {
    orderPage.value = 1
})
</script>
