<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">Dashboard</h1>
            <p class="text-sm text-muted mt-1">A quick look at your catalog, schedules, and orders that need action.</p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard v-for="stat in stats" :key="stat.label">
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center size-10 rounded-lg bg-elevated text-primary">
                        <UIcon :name="stat.icon" class="size-5" />
                    </div>
                    <div>
                        <p class="text-xs text-muted">{{ stat.label }}</p>
                        <p class="text-2xl font-semibold text-highlighted">{{ stat.value }}</p>
                    </div>
                </div>
            </UCard>
        </div>

        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <h2 class="font-medium">Needs attention</h2>
                    <UBadge v-if="pendingOrders.length" color="warning" variant="subtle">
                        {{ pendingOrders.length }} pending
                    </UBadge>
                </div>
            </template>

            <p v-if="!loading && pendingOrders.length === 0" class="text-sm text-muted py-6 text-center">
                No pending orders right now.
            </p>

            <template v-else>
                <div class="hidden sm:block max-h-80 overflow-y-auto">
                    <UTable :data="pendingOrders" :columns="orderColumns" :loading="loading">
                        <template #schedule-cell="{ row }">
                            <NuxtLink :to="`/admin/schedules/${row.original.scheduleUuid}`" class="text-primary hover:underline">
                                {{ row.original.scheduleTitle }}
                            </NuxtLink>
                        </template>
                        <template #actions-cell="{ row }">
                            <div class="flex items-center gap-2">
                                <BaseButton
                                    v-if="row.original.scheduleStatus === 'closed'"
                                    size="xs"
                                    color="success"
                                    variant="soft"
                                    :loading="actingOn === row.original.uuid"
                                    @click="setOrderStatus(row.original, 'confirmed')"
                                >
                                    Confirm
                                </BaseButton>
                                <span v-else class="text-xs text-dimmed">Close schedule to confirm</span>
                                <BaseButton
                                    size="xs"
                                    color="error"
                                    variant="soft"
                                    :loading="actingOn === row.original.uuid"
                                    @click="cancelOrder(row.original)"
                                >
                                    Cancel
                                </BaseButton>
                            </div>
                        </template>
                    </UTable>
                </div>
                <div class="sm:hidden space-y-2 p-2 max-h-80 overflow-y-auto">
                    <ListCard v-for="order in pendingOrders" :key="order.uuid" :actions="pendingOrderActions(order)">
                        <template #title>
                            <p class="font-medium text-highlighted">{{ order.customer_name }}</p>
                        </template>
                        <template #subtitle>
                            <NuxtLink :to="`/admin/schedules/${order.scheduleUuid}`" class="text-primary hover:underline">
                                {{ order.scheduleTitle }}
                            </NuxtLink>
                        </template>
                        <template #meta>
                            <span class="font-medium text-highlighted">₱{{ order.total_amount }}</span>
                        </template>
                    </ListCard>
                </div>
            </template>
        </UCard>

        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <h2 class="font-medium">Recent schedules</h2>
                    <BaseButton to="/admin/schedules" size="xs" color="neutral" variant="ghost">View all</BaseButton>
                </div>
            </template>

            <div class="divide-y divide-default">
                <NuxtLink
                    v-for="schedule in recentSchedules"
                    :key="schedule.uuid"
                    :to="`/admin/schedules/${schedule.uuid}`"
                    class="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-highlighted"
                >
                    <span class="text-sm">{{ schedule.title }}</span>
                    <StatusBadge :color="scheduleStatusColor[schedule.status]" :label="schedule.status" />
                </NuxtLink>
                <p v-if="!loading && recentSchedules.length === 0" class="text-sm text-muted py-6 text-center">
                    No schedules yet.
                </p>
            </div>
        </UCard>

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
import { productService } from '@/components/api/admin/ProductService'
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Dashboard' })

interface Schedule {
    uuid: string
    title: string
    status: 'open' | 'closed' | 'finished'
    is_open: boolean
    created_at: string
}

interface Order {
    uuid: string
    customer_name: string
    customer_contact: string
    status: 'pending' | 'confirmed' | 'cancelled'
    total_amount: string
    created_at: string
}

interface PendingOrder extends Order {
    scheduleUuid: string
    scheduleTitle: string
    scheduleStatus: Schedule['status']
}

const toast = useToast()
const loading = ref(true)
const actingOn = ref<string | null>(null)

const totalProducts = ref(0)
const schedules = ref<Schedule[]>([])
const pendingOrders = ref<PendingOrder[]>([])

const stats = computed(() => [
    { label: 'Total products', value: totalProducts.value, icon: 'i-lucide-package' },
    { label: 'Open schedules', value: schedules.value.filter((s) => s.status === 'open').length, icon: 'i-lucide-calendar-clock' },
    { label: 'Finished schedules', value: schedules.value.filter((s) => s.status === 'finished').length, icon: 'i-lucide-check-circle' },
    { label: 'Pending orders', value: pendingOrders.value.length, icon: 'i-lucide-clock-alert' }
])

const recentSchedules = computed(() =>
    [...schedules.value]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
)

const orderColumns: TableColumn<PendingOrder>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { id: 'schedule', header: 'Schedule' },
    { accessorKey: 'total_amount', header: 'Total' },
    { id: 'actions', header: '' }
]

/**
 * There is no endpoint to list orders across all schedules, so pending orders
 * are aggregated client-side: fetch every schedule, then fetch each schedule's
 * orders in parallel and keep only the pending ones.
 */
async function loadDashboard() {
    loading.value = true
    try {
        const [productsResponse, schedulesResponse] = await Promise.all([
            productService.fetchProducts({ per_page: 1 }),
            pasabuyScheduleService.fetchSchedules({ per_page: 100 })
        ])

        totalProducts.value = productsResponse.data.total
        schedules.value = schedulesResponse.data.data

        const ordersPerSchedule = await Promise.all(
            schedules.value.map((schedule) => pasabuyScheduleService.fetchOrders(schedule.uuid))
        )

        pendingOrders.value = ordersPerSchedule
            .flatMap((response, index) =>
                (response.data as Order[])
                    .filter((order) => order.status === 'pending')
                    .map((order) => ({
                        ...order,
                        scheduleUuid: schedules.value[index]!.uuid,
                        scheduleTitle: schedules.value[index]!.title,
                        scheduleStatus: schedules.value[index]!.status
                    }))
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch (error) {
        toast.add({ title: 'Failed to load dashboard', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

async function setOrderStatus(order: PendingOrder, status: 'confirmed' | 'cancelled') {
    actingOn.value = order.uuid
    try {
        await pasabuyScheduleService.updateOrderStatus(order.uuid, status)
        pendingOrders.value = pendingOrders.value.filter((o) => o.uuid !== order.uuid)
        toast.add({ title: `Order ${status}`, color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        actingOn.value = null
    }
}

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

function cancelOrder(order: PendingOrder) {
    askConfirm({
        title: 'Cancel order?',
        description: `Cancel ${order.customer_name}'s order? This cannot be undone.`,
        confirmLabel: 'Cancel order',
        color: 'error',
        action: () => setOrderStatus(order, 'cancelled')
    })
}

function pendingOrderActions(order: PendingOrder): DropdownMenuItem[] {
    return [
        ...(order.scheduleStatus === 'closed'
            ? [{ label: 'Confirm order', icon: 'i-lucide-check', color: 'success' as const, loading: actingOn.value === order.uuid, onSelect: () => setOrderStatus(order, 'confirmed') }]
            : []),
        { label: 'Cancel order', icon: 'i-lucide-x', color: 'error', loading: actingOn.value === order.uuid, onSelect: () => cancelOrder(order) }
    ]
}

onMounted(loadDashboard)
onPullToRefresh(loadDashboard)
</script>
