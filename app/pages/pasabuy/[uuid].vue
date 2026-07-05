<template>
    <div class="min-h-screen bg-default px-4 py-8" :class="{ 'pb-32': showBottomBar }">
        <div class="mx-auto max-w-2xl space-y-6">
            <div v-if="loading" class="text-center text-muted">Loading…</div>

            <UAlert v-else-if="notFound" color="error" variant="subtle" title="Pasabuy not found" description="This link doesn't point to a valid pasabuy." />

            <template v-else-if="schedule">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h1 class="text-2xl font-semibold text-highlighted">{{ schedule.title }}</h1>
                        <p v-if="schedule.description" class="mt-1 text-muted">{{ schedule.description }}</p>
                    </div>
                    <UButton v-if="isLoggedIn" size="sm" color="neutral" variant="soft" icon="i-lucide-receipt" to="/customer">
                        My Orders
                    </UButton>
                </div>

                <UAlert
                    v-if="!schedule.is_open"
                    color="warning"
                    variant="subtle"
                    title="This pasabuy is closed"
                    description="Ordering is no longer available for this pasabuy."
                />

                <UCard v-if="myOrder && !editingOrder && !orderResult">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="font-medium">Your order</h2>
                            <UBadge :color="orderStatusColor[myOrder.status]" variant="subtle">{{ myOrder.status }}</UBadge>
                        </div>
                    </template>

                    <div class="divide-y divide-default">
                        <div
                            v-for="item in myOrder.items"
                            :key="item.uuid"
                            class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                            <div>
                                <p class="font-medium text-highlighted">{{ item.product_name }}</p>
                                <p class="text-sm text-muted">₱{{ item.product_price }} × {{ item.quantity }}</p>
                            </div>
                            <p class="font-medium text-highlighted">₱{{ item.subtotal }}</p>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex items-center justify-between gap-3">
                            <p class="font-semibold text-highlighted">Total: ₱{{ myOrder.total_amount }}</p>
                            <UButton v-if="myOrder.is_editable" variant="soft" icon="i-lucide-pencil" @click="startEditOrder">
                                Edit order
                            </UButton>
                            <p v-else class="text-sm text-muted">This order can no longer be edited.</p>
                        </div>
                    </template>
                </UCard>

                <template v-if="(!myOrder || editingOrder) && !orderResult">
                    <UInput
                        v-if="schedule.products.length > 5"
                        v-model="productSearch"
                        icon="i-lucide-search"
                        placeholder="Search items…"
                        class="w-full"
                    />

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h2 class="font-medium">{{ editingOrder ? 'Edit your items' : 'Items' }}</h2>
                                <UButton v-if="editingOrder" size="xs" color="neutral" variant="ghost" @click="cancelEditOrder">
                                    Cancel
                                </UButton>
                            </div>
                        </template>

                        <div class="divide-y divide-default">
                            <div
                                v-for="sp in filteredProducts"
                                :key="sp.uuid"
                                class="flex items-center gap-4 p-4"
                            >
                                <button
                                    v-if="sp.product.image_url"
                                    type="button"
                                    class="shrink-0 cursor-pointer"
                                    aria-label="Preview image"
                                    @click="openPreview(sp.product)"
                                >
                                    <img
                                        :src="sp.product.image_url"
                                        class="size-14 rounded-lg object-cover transition hover:opacity-80"
                                        alt=""
                                    >
                                </button>
                                <div v-else class="flex size-14 shrink-0 items-center justify-center rounded-lg bg-elevated text-dimmed">
                                    <UIcon name="i-lucide-image" class="size-5" />
                                </div>

                                <div class="min-w-0 flex-1">
                                    <p class="truncate font-medium text-highlighted">{{ sp.product.name }}</p>
                                    <p class="text-sm text-muted">₱{{ sp.price }}</p>
                                    <p v-if="sp.max_quantity !== null" class="text-xs text-dimmed">Limit {{ sp.max_quantity }} per order</p>
                                    <p v-if="quantities[sp.product.uuid]" class="text-sm font-medium text-primary">
                                        Subtotal: ₱{{ (Number(sp.price) * quantities[sp.product.uuid]!).toFixed(2) }}
                                    </p>
                                </div>

                                <div class="flex shrink-0 items-center gap-2">
                                    <UButton
                                        icon="i-lucide-minus"
                                        size="xs"
                                        color="neutral"
                                        variant="soft"
                                        :disabled="!schedule.is_open || !quantities[sp.product.uuid]"
                                        @click="decrement(sp)"
                                    />
                                    <span class="w-6 text-center font-medium">{{ quantities[sp.product.uuid] || 0 }}</span>
                                    <UButton
                                        icon="i-lucide-plus"
                                        size="xs"
                                        color="neutral"
                                        variant="soft"
                                        :disabled="!schedule.is_open || atLimit(sp)"
                                        @click="increment(sp)"
                                    />
                                </div>
                            </div>

                            <div v-if="filteredProducts.length === 0" class="flex flex-col items-center gap-3 py-10">
                                <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                                <p class="text-sm text-muted">
                                    {{ schedule.products.length === 0 ? 'No items available yet.' : 'No items match your search.' }}
                                </p>
                            </div>
                        </div>
                    </UCard>
                </template>

                <UCard v-if="orderResult">
                    <div class="flex flex-col items-center gap-3 py-6 text-center">
                        <div class="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
                            <UIcon name="i-lucide-check" class="size-6" />
                        </div>
                        <div>
                            <p class="font-medium text-highlighted">Order placed!</p>
                            <p class="mt-1 text-sm text-muted">
                                Thanks, {{ orderResult.customer_name }}! Your total is ₱{{ orderResult.total_amount }}. The seller will reach out to confirm.
                            </p>
                        </div>
                    </div>
                </UCard>
            </template>
        </div>

        <div v-if="showBottomBar" class="fixed inset-x-0 bottom-0 border-t border-default bg-default/95 backdrop-blur-sm">
            <div class="mx-auto max-w-2xl space-y-3 px-4 py-3">
                <template v-if="!isLoggedIn">
                    <div class="flex items-center justify-between gap-3">
                        <p class="text-sm text-muted">Log in to place an order.</p>
                        <div class="flex shrink-0 gap-2">
                            <UButton size="sm" color="neutral" variant="soft" :to="`/register?redirect=${encodeURIComponent(route.fullPath)}`">
                                Sign up
                            </UButton>
                            <UButton size="sm" :to="`/customer/login?redirect=${encodeURIComponent(route.fullPath)}`">
                                Log in
                            </UButton>
                        </div>
                    </div>
                </template>

                <template v-else-if="!isApproved">
                    <p class="text-sm text-warning">Your account is pending admin approval before you can order.</p>
                </template>

                <template v-else>
                    <UAlert v-if="submitError" color="error" variant="subtle" :title="submitError" />
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-xs text-muted">{{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}</p>
                            <p class="text-lg font-semibold text-highlighted">₱{{ total.toFixed(2) }}</p>
                        </div>
                        <UButton
                            size="lg"
                            :loading="submitting"
                            :disabled="!schedule?.is_open || !hasItems"
                            @click="submitOrder"
                        >
                            {{ editingOrder ? 'Update order' : 'Place order' }}
                        </UButton>
                    </div>
                </template>
            </div>
        </div>

        <UModal v-model:open="isPreviewOpen" :title="previewProduct?.name">
            <template #body>
                <img
                    v-if="previewProduct?.image_url"
                    :src="previewProduct.image_url"
                    class="max-h-[70vh] w-full rounded-lg object-contain"
                    alt=""
                >
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { publicPasabuyService } from '@/components/api/public/PublicPasabuyService'
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'

definePageMeta({ layout: false })

interface Product {
    uuid: string
    name: string
    description: string | null
    image_url: string | null
    is_active: boolean
}

interface ScheduleProduct {
    uuid: string
    price: string
    max_quantity: number | null
    product: Product
}

interface Schedule {
    uuid: string
    title: string
    description: string | null
    status: string
    is_open: boolean
    products: ScheduleProduct[]
}

interface OrderResult {
    uuid: string
    customer_name: string
    total_amount: string
}

interface MyOrderItem {
    uuid: string
    product_uuid: string
    product_name: string
    product_price: string
    quantity: number
    subtotal: string
}

interface MyOrder {
    uuid: string
    status: 'pending' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    items: MyOrderItem[]
    pasabuy_schedule: { uuid: string } | null
}

const route = useRoute()
const uuid = route.params.uuid as string
const toast = useToast()
const { user, fetchCurrentUser } = useAuth()

const schedule = ref<Schedule | null>(null)
const loading = ref(true)
const notFound = ref(false)
const productSearch = ref('')

const quantities = ref<Record<string, number>>({})
const submitting = ref(false)
const submitError = ref<string | null>(null)
const orderResult = ref<OrderResult | null>(null)

const myOrder = ref<MyOrder | null>(null)
const editingOrder = ref(false)

const orderStatusColor: Record<string, 'neutral' | 'success' | 'error'> = {
    pending: 'neutral',
    confirmed: 'success',
    cancelled: 'error'
}

const isLoggedIn = computed(() => !!user.value)
const isApproved = computed(() => user.value?.is_approved === true)

const showBottomBar = computed(() => !!schedule.value && !orderResult.value && (!myOrder.value || editingOrder.value))

const filteredProducts = computed(() => {
    if (!schedule.value) return []
    const query = productSearch.value.trim().toLowerCase()
    if (!query) return schedule.value.products
    return schedule.value.products.filter((sp) => sp.product.name.toLowerCase().includes(query))
})

const total = computed(() => {
    if (!schedule.value) return 0
    return schedule.value.products.reduce((sum, sp) => {
        const qty = quantities.value[sp.product.uuid] || 0
        return sum + qty * Number(sp.price)
    }, 0)
})

const itemCount = computed(() => Object.values(quantities.value).reduce((sum, qty) => sum + qty, 0))
const hasItems = computed(() => itemCount.value > 0)

function atLimit(sp: ScheduleProduct): boolean {
    if (sp.max_quantity === null) return false
    return (quantities.value[sp.product.uuid] || 0) >= sp.max_quantity
}

const isPreviewOpen = ref(false)
const previewProduct = ref<Product | null>(null)

function openPreview(product: Product) {
    previewProduct.value = product
    isPreviewOpen.value = true
}

async function load() {
    loading.value = true
    try {
        const response = await publicPasabuyService.fetchSchedule(uuid)
        schedule.value = response.data
        for (const sp of schedule.value!.products) {
            quantities.value[sp.product.uuid] = 0
        }
    } catch (error) {
        if (error instanceof APIError) {
            notFound.value = true
        } else {
            throw error
        }
    } finally {
        loading.value = false
    }
}

async function restoreSession() {
    if (!import.meta.client) return
    if (!localStorage.getItem('_token')) return
    try {
        await fetchCurrentUser()
    } catch {
        // invalid/expired token — treat as logged out
    }
}

/**
 * Customers can only have one active (pending/confirmed) order per schedule —
 * find it, if any, so we show its summary instead of a fresh ordering form.
 */
async function loadMyOrder() {
    try {
        const response = await customerOrderService.fetchMyOrders({ per_page: 100 })
        const orders = response.data.data as MyOrder[]
        myOrder.value = orders.find((o) => o.pasabuy_schedule?.uuid === uuid && o.status !== 'cancelled') ?? null
    } catch {
        // non-critical — fall back to showing a fresh ordering form
    }
}

function startEditOrder() {
    if (!myOrder.value) return
    for (const sp of schedule.value?.products ?? []) {
        quantities.value[sp.product.uuid] = 0
    }
    for (const item of myOrder.value.items) {
        quantities.value[item.product_uuid] = item.quantity
    }
    submitError.value = null
    editingOrder.value = true
}

function cancelEditOrder() {
    editingOrder.value = false
    submitError.value = null
}

function increment(sp: ScheduleProduct) {
    if (atLimit(sp)) return
    const current = quantities.value[sp.product.uuid] || 0
    quantities.value[sp.product.uuid] = current + 1
}

function decrement(sp: ScheduleProduct) {
    const current = quantities.value[sp.product.uuid] || 0
    quantities.value[sp.product.uuid] = Math.max(0, current - 1)
}

async function submitOrder() {
    submitError.value = null
    submitting.value = true
    try {
        const items = Object.entries(quantities.value)
            .filter(([, qty]) => qty > 0)
            .map(([product_uuid, quantity]) => ({ product_uuid, quantity }))

        if (myOrder.value) {
            const response = await customerOrderService.updateMyOrder(myOrder.value.uuid, items)
            myOrder.value = response.data
            editingOrder.value = false
            toast.add({ title: 'Order updated', color: 'success' })
        } else {
            const response = await customerOrderService.placeOrder(uuid, items)
            orderResult.value = response.data
        }
    } catch (error) {
        submitError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        submitting.value = false
    }
}

onMounted(async () => {
    await restoreSession()
    await load()
    if (isLoggedIn.value && isApproved.value) {
        await loadMyOrder()
    }
})
</script>
