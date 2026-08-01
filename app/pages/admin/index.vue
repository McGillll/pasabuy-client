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

        <DailyVerseCard />

        <KpiStrip :items="kpiItems" />

        <p class="text-xs font-bold uppercase tracking-wide text-dimmed">Today</p>

        <div class="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6">
            <div class="space-y-6">
                <AttentionQueue
                    title="Needs attention"
                    hint="Orders waiting on confirm or cancel"
                    :count="pendingOrders.length"
                    :items="attentionQueueItems"
                    view-all-href="/admin/schedules"
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
                    :title="rankingTabs.find((tab) => tab.value === rankingTab)?.label ?? 'Rankings'"
                    :tabs="rankingTabs"
                    :active-tab="rankingTab"
                    @update:active-tab="(value) => (rankingTab = value as 'products' | 'buyers')"
                    :month="rankingMonth"
                    :year="rankingYear"
                    :items="rankingTab === 'products' ? topProductItems : topBuyerItems"
                    :loading="loadingRankings"
                    :empty-message="rankingTab === 'products' ? 'Product rankings aren\'t available yet' : 'No buyer rankings yet'"
                    :empty-description="rankingTab === 'products' ? 'We\'ll show your best-selling products here once order data is available.' : 'We\'ll show your best customers here once order data is available.'"
                    @change-month="onChangeRankingMonth"
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
import type { TopProduct } from '@/types/Product'
import type { TopBuyer } from '@/types/User'
import type { ScheduleBrowseItem } from '@/types/Schedule'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Dashboard' })

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
        status: ScheduleBrowseItem['status']
    }
}

interface PendingOrder extends Order {
    scheduleUuid: string
    scheduleTitle: string
    scheduleStatus: ScheduleBrowseItem['status']
}

const toast = useToast()
const loading = ref(true)
const actingOn = ref<string | null>(null)

const totalProducts = ref(0)
const totalMembers = ref(0)
const { data: schedules, ensure: ensureSchedulesLoaded } = useCachedFetch<ScheduleBrowseItem[]>(
    'admin-pasabuy-schedules',
    (etag) => pasabuyScheduleService.fetchSchedulesCacheable({ per_page: 100 }, etag)
)
const pendingOrders = ref<PendingOrder[]>([])
const loadingRankings = ref(true)
const topProducts = ref<TopProduct[]>([])
const topBuyers = ref<TopBuyer[]>([])
const rankingTab = ref<'products' | 'buyers'>('products')
const rankingTabs = [
    { label: 'Top products', value: 'products' },
    { label: 'Top buyers', value: 'buyers' }
]
const rankingMonth = ref(new Date().getMonth() + 1)
const rankingYear = ref(new Date().getFullYear())

function onChangeRankingMonth(delta: number) {
    let month = rankingMonth.value + delta
    let year = rankingYear.value

    if (month < 1) {
        month = 12
        year -= 1
    } else if (month > 12) {
        month = 1
        year += 1
    }

    rankingMonth.value = month
    rankingYear.value = year
}

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
    pendingOrders.value.slice(0, 3).map((order) => ({
        uuid: order.uuid,
        name: order.customer_name,
        subtitleLabel: order.scheduleTitle,
        subtitleHref: `/admin/schedules/${order.scheduleUuid}`,
        timestamp: new Date(order.created_at).toLocaleDateString(),
        amount: `₱${order.total_amount}`,
        menuItems: pendingOrderActions(order)
    }))
)

function scheduleClosingSoon(schedule: ScheduleBrowseItem): { closingSoon: boolean; note?: string } {
    if (!schedule.is_open || !schedule.pasabuy_schedule_date) return { closingSoon: false }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const cutoff = new Date(schedule.pasabuy_schedule_date)
    const daysUntilCutoff = Math.round((cutoff.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilCutoff <= 0) return { closingSoon: true, note: 'Closes today' }
    if (daysUntilCutoff === 1) return { closingSoon: true, note: 'Closes tomorrow' }
    return { closingSoon: false }
}

const scheduleRowItems = computed(() =>
    recentSchedules.value.map((schedule) => ({
        uuid: schedule.uuid,
        title: schedule.title,
        status: schedule.status,
        statusColor: scheduleStatusColor[schedule.status],
        statusLabel: schedule.status,
        href: `/admin/schedules/${schedule.uuid}`,
        ...scheduleClosingSoon(schedule)
    }))
)

const pipelineStages = ref<PipelineStage[]>([])

const topProductItems = computed(() => {
    const topQuantity = topProducts.value[0]?.total_quantity ?? 0
    return topProducts.value.map((product, index) => ({
        productId: product.uuid,
        rank: index + 1,
        name: product.name,
        progressPct: topQuantity > 0 ? (product.total_quantity / topQuantity) * 100 : 0,
        qty: product.total_quantity,
        unit: 'ordered'
    }))
})

const topBuyerItems = computed(() => {
    const topSpend = Number(topBuyers.value[0]?.total_spend ?? 0)
    return topBuyers.value.map((buyer, index) => ({
        productId: buyer.uuid,
        rank: index + 1,
        name: buyer.name,
        progressPct: topSpend > 0 ? (Number(buyer.total_spend) / topSpend) * 100 : 0,
        qty: `₱${buyer.total_spend}`,
        unit: `${buyer.order_count} orders`
    }))
})

async function loadDashboard(force = false) {
    loading.value = true
    try {
        const [
            productsResponse,
            ,
            ordersResponse,
            customersResponse,
            confirmedOrdersResponse,
            cancelledOrdersResponse
        ] = await Promise.all([
            productService.fetchProducts({ per_page: 1 }),
            ensureSchedulesLoaded(force),
            orderService.fetchOrders({ status: 'pending', per_page: 100 }),
            customerService.fetchCustomers({ per_page: 1, is_approved: '1' }),
            orderService.fetchOrders({ status: 'confirmed', per_page: 1 }),
            orderService.fetchOrders({ status: 'cancelled', per_page: 1 })
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

        pipelineStages.value = [
            { label: 'Pending', count: ordersResponse.data.total, color: 'bg-warning' },
            { label: 'Confirmed', count: confirmedOrdersResponse.data.total, color: 'bg-success' },
            { label: 'Cancelled', count: cancelledOrdersResponse.data.total, color: 'bg-error' }
        ]
    } catch (error) {
        toast.add({ title: 'Failed to load dashboard', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

async function loadRankings() {
    loadingRankings.value = true
    try {
        const [topProductsResponse, topBuyersResponse] = await Promise.all([
            productService.fetchTopSelling({ month: rankingMonth.value, year: rankingYear.value }),
            customerService.fetchTopBuyers({ month: rankingMonth.value, year: rankingYear.value })
        ])

        topProducts.value = topProductsResponse.data
        topBuyers.value = topBuyersResponse.data
    } catch (error) {
        toast.add({ title: 'Failed to load rankings', description: (error as APIError).message, color: 'error' })
    } finally {
        loadingRankings.value = false
    }
}

watch([rankingMonth, rankingYear], loadRankings)

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

onMounted(() => {
    loadDashboard()
    loadRankings()
})
onPullToRefresh(() => {
    loadDashboard(true)
    loadRankings()
})
</script>
