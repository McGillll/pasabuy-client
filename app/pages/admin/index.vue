<template>
    <div class="space-y-6">
        <PageHeader
            title="Dashboard"
            subtitle="A quick look at your catalog, schedules, and orders that need action."
            primary-label="New schedule"
            primary-icon="i-lucide-calendar-plus"
            secondary-label="Add product"
            secondary-icon="i-lucide-plus"
            @primary-click="navigateTo('/admin/schedules')"
            @secondary-click="navigateTo('/admin/products')"
        />

        <KpiStrip :items="kpiItems" />

        <div class="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6">
            <div class="space-y-6">
                <p class="text-xs font-bold uppercase tracking-wide text-dimmed">Today</p>

                <AttentionQueue
                    title="Needs attention"
                    hint="Orders waiting on confirm or cancel"
                    :count="pendingOrders.length"
                    :items="attentionQueueItems"
                    view-all-href="/admin/orders"
                    :loading="loading"
                />

                <SchedulePreviewList
                    title="Recent schedules"
                    :items="scheduleRowItems"
                    view-all-href="/admin/schedules"
                    :loading="loading"
                />
            </div>

            <div class="space-y-6">
                <PipelineBar title="Order pipeline" :stages="pipelineStages" />

                <RankedList
                    title="Top products"
                    :items="[]"
                    empty-message="Product rankings aren't available yet"
                    empty-description="We'll show your best-selling products here once order data is available."
                />
            </div>
        </div>

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
import { productService } from '@/components/api/admin/ProductService'
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import { orderService } from '@/components/api/admin/OrderService'
import { customerService } from '@/components/api/admin/CustomerService'
import APIError from '@/components/api/user/APIError'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { PipelineStage } from '@/components/PipelineBar.vue'

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
    pasabuy_schedule: {
        uuid: string
        title: string
        status: Schedule['status']
    }
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
const totalMembers = ref(0)
const { data: schedules, ensure: ensureSchedulesLoaded } = useCachedFetch<Schedule[]>(
    'admin-pasabuy-schedules',
    (etag) => pasabuyScheduleService.fetchSchedulesCacheable({ per_page: 100 }, etag)
)
const pendingOrders = ref<PendingOrder[]>([])

const stats = computed(() => [
    { label: 'Total members', value: totalMembers.value, icon: 'i-lucide-users' },
    { label: 'Total products', value: totalProducts.value, icon: 'i-lucide-package' },
    { label: 'Open schedules', value: (schedules.value ?? []).filter((s) => s.status === 'open').length, icon: 'i-lucide-calendar-clock' },
    { label: 'Finished schedules', value: (schedules.value ?? []).filter((s) => s.status === 'finished').length, icon: 'i-lucide-check-circle' },
    { label: 'Pending orders', value: pendingOrders.value.length, icon: 'i-lucide-clock-alert' }
])

const kpiItems = computed(() => [
    { ...stats.value[0], color: 'info' as const },
    { ...stats.value[1], color: 'primary' as const },
    { ...stats.value[2], color: 'success' as const },
    { ...stats.value[3], color: 'neutral' as const },
    { ...stats.value[4], color: 'warning' as const }
])

const recentSchedules = computed(() =>
    [...(schedules.value ?? [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
)

const attentionQueueItems = computed(() =>
    pendingOrders.value.map((order) => ({
        uuid: order.uuid,
        name: order.customer_name,
        subtitleLabel: order.scheduleTitle,
        subtitleHref: `/admin/schedules/${order.scheduleUuid}`,
        timestamp: new Date(order.created_at).toLocaleDateString(),
        amount: `₱${order.total_amount}`,
        menuItems: pendingOrderActions(order)
    }))
)

const scheduleRowItems = computed(() =>
    recentSchedules.value.map((schedule) => ({
        uuid: schedule.uuid,
        title: schedule.title,
        status: schedule.status,
        statusColor: scheduleStatusColor[schedule.status],
        statusLabel: schedule.status,
        href: `/admin/schedules/${schedule.uuid}`
    }))
)

const pipelineStages: PipelineStage[] = []

async function loadDashboard(force = false) {
    loading.value = true
    try {
        const [productsResponse, , ordersResponse, customersResponse] = await Promise.all([
            productService.fetchProducts({ per_page: 1 }),
            ensureSchedulesLoaded(force),
            orderService.fetchOrders({ status: 'pending', per_page: 100 }),
            customerService.fetchCustomers({ per_page: 1, is_approved: '1' })
        ])

        totalProducts.value = productsResponse.data.total
        totalMembers.value = customersResponse.data.total

        pendingOrders.value = (ordersResponse.data.items as Order[])
            .map((order) => ({
                ...order,
                scheduleUuid: order.pasabuy_schedule.uuid,
                scheduleTitle: order.pasabuy_schedule.title,
                scheduleStatus: order.pasabuy_schedule.status
            }))
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

onMounted(() => loadDashboard())
onPullToRefresh(() => loadDashboard(true))
</script>
