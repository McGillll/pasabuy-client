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

        <!-- Bento grid. DOM order is the mobile priority order (act first, glance second,
             browse last); lg placement turns it into a 12-column grid. -->
        <div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
            <LiveScheduleCard
                class="h-full lg:col-span-8"
                :schedule="liveSchedule"
                :order-count="liveOrderCount"
                :pending-count="livePendingCount"
                :other-open-count="Math.max(0, openSchedules.length - 1)"
                :loading="loading"
            />

            <AttentionQueue
                class="h-full lg:col-span-4 lg:row-span-2"
                title="Needs attention"
                hint="Orders waiting on confirm or cancel"
                help-text="Orders land here while they're still pending, meaning you haven't confirmed or cancelled them yet. Confirm or cancel each one from its menu to clear it from this list."
                :count="pendingOrders.length"
                :items="attentionQueueItems"
                view-all-href="/admin/schedules"
                :loading="loading"
            />

            <KpiStrip class="lg:col-span-8 lg:grid-cols-4" :items="kpiItems" :loading="loading" />

            <div class="space-y-4 sm:space-y-6 lg:col-span-7">
                <PipelineBar
                    title="Order pipeline"
                    help-text="How many orders across all your schedules are currently pending, confirmed, or cancelled."
                    :stages="pipelineStages"
                    :loading="loading"
                />

                <SchedulePreviewList
                    title="Recent schedules"
                    :items="scheduleRowItems"
                    view-all-href="/admin/schedules"
                    :loading="loading"
                />
            </div>

            <div class="space-y-4 sm:space-y-6 lg:col-span-5">
                <RankedList
                    :title="rankingTabs.find((tab) => tab.value === rankingTab)?.label ?? 'Rankings'"
                    :help-text="rankingTab === 'products'
                        ? 'Ranked by total quantity ordered in the selected month, across all your schedules.'
                        : 'Ranked by total amount spent in the selected month, across all your schedules.'"
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
const { setOrderStatusUndoable } = useOrderUndoAction()
const loading = ref(true)

const totalProducts = ref(0)
const totalMembers = ref(0)
const { data: schedules, ensure: ensureSchedulesLoaded } = useCachedFetch<ScheduleBrowseItem[]>(
    'admin-pasabuy-schedules',
    (etag) => pasabuyScheduleService.fetchSchedulesCacheable({ per_page: 100 }, etag)
)
const pendingOrders = ref<PendingOrder[]>([])
const liveOrderCount = ref(0)

const openSchedules = computed(() => (schedules.value ?? []).filter((s) => s.status === 'open'))

// The hero tile shows the open pasabuy closing soonest; undated ones sort last.
const liveSchedule = computed(() =>
    [...openSchedules.value].sort((a, b) =>
        (a.pasabuy_schedule_date ?? '9999-12-31').localeCompare(b.pasabuy_schedule_date ?? '9999-12-31')
    )[0] ?? null
)

const livePendingCount = computed(() =>
    liveSchedule.value ? pendingOrders.value.filter((o) => o.scheduleUuid === liveSchedule.value?.uuid).length : 0
)
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
    {
        label: 'Total members',
        value: totalMembers.value,
        icon: 'i-lucide-users',
        tooltip: 'Customers you\'ve approved to place orders. Pending signups aren\'t counted until you approve them in Members.'
    },
    { label: 'Total products', value: totalProducts.value, icon: 'i-lucide-package' },
    {
        label: 'Open schedules',
        value: (schedules.value ?? []).filter((s) => s.status === 'open').length,
        icon: 'i-lucide-calendar-clock',
        tooltip: 'Schedules still accepting orders. A schedule moves to Closed once its schedule date passes.'
    },
    {
        label: 'Finished schedules',
        value: (schedules.value ?? []).filter((s) => s.status === 'finished').length,
        icon: 'i-lucide-check-circle',
        tooltip: 'Schedules you\'ve marked complete after fulfilling all orders, the final stage after Closed.'
    }
])

const kpiColors = ['info', 'primary', 'success', 'neutral'] as const

const kpiItems = computed(() => stats.value.map((stat, index) => ({ ...stat, color: kpiColors[index] })))

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
        amount: order.total_amount,
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
        statusLabel: scheduleStatusLabel[schedule.status] ?? schedule.status,
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
    const topSpend = toNumber(topBuyers.value[0]?.total_spend ?? 0)
    return topBuyers.value.map((buyer, index) => ({
        productId: buyer.uuid,
        rank: index + 1,
        name: buyer.name,
        progressPct: topSpend > 0 ? (toNumber(buyer.total_spend) / topSpend) * 100 : 0,
        qty: buyer.total_spend,
        qtyPrefix: '₱',
        unitValue: buyer.order_count,
        unitLabel: 'orders'
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

        liveOrderCount.value = liveSchedule.value
            ? (await orderService.fetchOrders({ schedule_uuid: liveSchedule.value.uuid, per_page: 1 })).data.total
            : 0
    } catch (error) {
        toast.add({
            title: 'Failed to load dashboard',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadDashboard(true) }]
        })
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
        toast.add({
            title: 'Failed to load rankings',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadRankings() }]
        })
    } finally {
        loadingRankings.value = false
    }
}

watch([rankingMonth, rankingYear], loadRankings)

function setOrderStatus(order: PendingOrder, status: 'confirmed' | 'cancelled') {
    setOrderStatusUndoable(order, status, {
        onApply: () => { pendingOrders.value = pendingOrders.value.filter((o) => o.uuid !== order.uuid) },
        onRevert: () => { pendingOrders.value = [order, ...pendingOrders.value] }
    })
}

function cancelOrder(order: PendingOrder) {
    setOrderStatus(order, 'cancelled')
}

function pendingOrderActions(order: PendingOrder): DropdownMenuItem[] {
    return [
        ...(order.scheduleStatus === 'closed'
            ? [{ label: 'Confirm order', icon: 'i-lucide-check', color: 'success' as const, onSelect: () => setOrderStatus(order, 'confirmed') }]
            : []),
        { label: 'Cancel order', icon: 'i-lucide-x', color: 'error', onSelect: () => cancelOrder(order) }
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
