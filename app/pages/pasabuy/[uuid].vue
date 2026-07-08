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

                    <UAlert
                        v-if="myOrder.status === 'needs_confirmation'"
                        color="warning"
                        variant="subtle"
                        icon="i-lucide-alert-triangle"
                        title="Some items need your confirmation"
                        description="The seller found a different price in-store. Review the items below."
                        class="mb-4"
                    />

                    <div class="divide-y divide-default">
                        <div v-for="item in myOrder.items" :key="item.uuid" class="py-3 first:pt-0 last:pb-0">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <p class="font-medium text-highlighted">{{ item.product_name }}</p>
                                        <UBadge v-if="item.is_bonus" color="success" variant="subtle" size="sm">FREE</UBadge>
                                    </div>
                                    <p class="text-sm text-muted">₱{{ item.actual_price ?? item.estimated_price }} × {{ item.quantity }}</p>
                                </div>
                                <p class="font-medium text-highlighted">₱{{ item.subtotal }}</p>
                            </div>

                            <div v-if="item.confirmation_status === 'pending'" class="mt-3 rounded-lg bg-warning/10 p-3">
                                <p class="text-sm text-warning">
                                    <template v-if="item.actual_price === null">Out of stock in-store.</template>
                                    <template v-else>New price: ₱{{ item.actual_price }} (was ₱{{ item.estimated_price }})</template>
                                </p>
                                <div class="mt-2 flex flex-wrap items-center gap-2">
                                    <UInput
                                        v-if="item.actual_price !== null"
                                        v-model.number="resolveQuantities[item.uuid]"
                                        type="number"
                                        min="1"
                                        size="sm"
                                        class="w-20"
                                    />
                                    <UButton
                                        v-if="item.actual_price !== null"
                                        size="xs"
                                        color="success"
                                        :loading="resolvingItem === item.uuid"
                                        @click="acceptItem(item)"
                                    >
                                        Accept
                                    </UButton>
                                    <UButton
                                        size="xs"
                                        color="error"
                                        variant="soft"
                                        :loading="resolvingItem === item.uuid"
                                        @click="removeItem(item)"
                                    >
                                        Remove
                                    </UButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex items-center justify-between gap-3">
                            <p class="font-semibold text-highlighted">Total: ₱{{ myOrder.total_amount }}</p>
                            <div class="flex items-center gap-2">
                                <UButton v-if="myOrder.is_editable" variant="soft" icon="i-lucide-pencil" @click="startEditOrder">
                                    Edit order
                                </UButton>
                                <template v-if="myOrder.is_cancellable && !confirmingCancel">
                                    <UButton color="error" variant="ghost" size="sm" @click="confirmingCancel = true">
                                        Cancel order
                                    </UButton>
                                </template>
                                <template v-else-if="myOrder.is_cancellable">
                                    <span class="text-sm text-muted">Are you sure?</span>
                                    <UButton color="error" size="sm" :loading="cancellingOrder" @click="cancelOrder">
                                        Yes, cancel
                                    </UButton>
                                    <UButton color="neutral" variant="ghost" size="sm" @click="confirmingCancel = false">
                                        No
                                    </UButton>
                                </template>
                                <p v-if="!myOrder.is_editable && !myOrder.is_cancellable" class="text-sm text-muted">
                                    This order can no longer be edited.
                                </p>
                            </div>
                        </div>
                    </template>
                </UCard>

                <template v-if="(!myOrder || editingOrder) && !orderResult">
                    <UInput
                        v-if="catalog.length > 5"
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
                                v-for="product in filteredProducts"
                                :key="product.uuid"
                                class="flex items-center gap-4 p-4"
                            >
                                <button
                                    v-if="product.image_url"
                                    type="button"
                                    class="shrink-0 cursor-pointer"
                                    aria-label="Preview image"
                                    @click="openPreview(product)"
                                >
                                    <img
                                        :src="product.image_url"
                                        class="size-14 rounded-lg object-cover transition hover:opacity-80"
                                        alt=""
                                    >
                                </button>
                                <div v-else class="flex size-14 shrink-0 items-center justify-center rounded-lg bg-elevated text-dimmed">
                                    <UIcon name="i-lucide-image" class="size-5" />
                                </div>

                                <div class="min-w-0 flex-1">
                                    <p class="truncate font-medium text-highlighted">{{ product.name }}</p>
                                    <div class="flex items-center gap-2">
                                        <p class="text-sm text-muted">₱{{ product.default_price }}</p>
                                        <span class="text-xs text-dimmed">estimated</span>
                                    </div>
                                    <p v-if="quantities[product.uuid]" class="text-sm font-medium text-primary">
                                        Subtotal: ₱{{ (Number(product.default_price) * quantities[product.uuid]!).toFixed(2) }}
                                    </p>

                                    <div v-if="quantities[product.uuid]" class="mt-2 flex flex-wrap items-center gap-2">
                                        <UCheckbox
                                            v-model="getPreference(product.uuid).auto_buy_if_under_max"
                                            label="Auto-buy if under my max price"
                                            size="sm"
                                        />
                                        <UInput
                                            v-if="getPreference(product.uuid).auto_buy_if_under_max"
                                            v-model.number="getPreference(product.uuid).max_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Max price"
                                            size="sm"
                                            class="w-28"
                                        >
                                            <template #leading>
                                                <span class="text-xs text-dimmed">₱</span>
                                            </template>
                                        </UInput>
                                    </div>
                                </div>

                                <div class="flex shrink-0 items-center gap-2">
                                    <UButton
                                        icon="i-lucide-minus"
                                        size="xs"
                                        color="neutral"
                                        variant="soft"
                                        :disabled="!schedule.is_open || !quantities[product.uuid]"
                                        @click="decrement(product)"
                                    />
                                    <span class="w-6 text-center font-medium">{{ quantities[product.uuid] || 0 }}</span>
                                    <UButton
                                        icon="i-lucide-plus"
                                        size="xs"
                                        color="neutral"
                                        variant="soft"
                                        :disabled="!schedule.is_open"
                                        @click="increment(product)"
                                    />
                                </div>
                            </div>

                            <div v-if="filteredProducts.length === 0" class="flex flex-col items-center gap-3 py-10">
                                <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                                <p class="text-sm text-muted">
                                    {{ catalog.length === 0 ? 'No items available yet.' : 'No items match your search.' }}
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
import { publicProductService } from '@/components/api/public/PublicProductService'
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'
import type { Schedule } from '@/types/Schedule'

definePageMeta({ layout: false })

interface OrderResult {
    uuid: string
    customer_name: string
    total_amount: string
}

interface MyOrderItem {
    uuid: string
    product_uuid: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_bonus: boolean
    confirmation_status: 'none' | 'pending' | 'accepted' | 'removed'
    max_price: string | null
    auto_buy_if_under_max: boolean
    quantity: number
    subtotal: string
}

interface MyOrder {
    uuid: string
    status: 'pending' | 'needs_confirmation' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    is_cancellable: boolean
    needs_confirmation_count: number
    items: MyOrderItem[]
    pasabuy_schedule: { uuid: string } | null
}

const route = useRoute()
const uuid = route.params.uuid as string
const toast = useToast()
const { user, fetchCurrentUser } = useAuth()

const schedule = ref<Schedule | null>(null)
const catalog = ref<Product[]>([])
const loading = ref(true)
const notFound = ref(false)
const productSearch = ref('')

const quantities = ref<Record<string, number>>({})

interface ItemPreference {
    max_price: number | null
    auto_buy_if_under_max: boolean
}

const preferences = ref<Record<string, ItemPreference>>({})

function getPreference(productUuid: string): ItemPreference {
    return preferences.value[productUuid] ??= { max_price: null, auto_buy_if_under_max: false }
}
const submitting = ref(false)
const submitError = ref<string | null>(null)
const orderResult = ref<OrderResult | null>(null)

const myOrder = ref<MyOrder | null>(null)
const editingOrder = ref(false)

const orderStatusColor: Record<string, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending: 'neutral',
    needs_confirmation: 'warning',
    confirmed: 'success',
    cancelled: 'error'
}

const isLoggedIn = computed(() => !!user.value)
const isApproved = computed(() => user.value?.is_approved === true)

const showBottomBar = computed(() => !!schedule.value && !orderResult.value && (!myOrder.value || editingOrder.value))

const filteredProducts = computed(() => {
    const query = productSearch.value.trim().toLowerCase()
    if (!query) return catalog.value
    return catalog.value.filter((product) => product.name.toLowerCase().includes(query))
})

const total = computed(() => {
    return catalog.value.reduce((sum, product) => {
        const qty = quantities.value[product.uuid] || 0
        return sum + qty * Number(product.default_price)
    }, 0)
})

const itemCount = computed(() => Object.values(quantities.value).reduce((sum, qty) => sum + qty, 0))
const hasItems = computed(() => itemCount.value > 0)

const isPreviewOpen = ref(false)
const previewProduct = ref<Product | null>(null)

function openPreview(product: Product) {
    previewProduct.value = product
    isPreviewOpen.value = true
}

async function load() {
    loading.value = true
    try {
        const [scheduleResponse, catalogResponse] = await Promise.all([
            publicPasabuyService.fetchSchedule(uuid),
            publicProductService.fetchCatalog({ per_page: 200 })
        ])
        schedule.value = scheduleResponse.data
        catalog.value = catalogResponse.data.data
        for (const product of catalog.value) {
            quantities.value[product.uuid] = 0
            getPreference(product.uuid)
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
        syncResolveQuantities()
    } catch {
        // non-critical — fall back to showing a fresh ordering form
    }
}

const resolveQuantities = ref<Record<string, number>>({})
const resolvingItem = ref<string | null>(null)
const confirmingCancel = ref(false)
const cancellingOrder = ref(false)

function syncResolveQuantities() {
    for (const item of myOrder.value?.items ?? []) {
        if (item.confirmation_status === 'pending') {
            resolveQuantities.value[item.uuid] = item.quantity
        }
    }
}

async function acceptItem(item: MyOrderItem) {
    if (!myOrder.value) return
    resolvingItem.value = item.uuid
    try {
        const quantity = resolveQuantities.value[item.uuid] ?? item.quantity
        const response = await customerOrderService.resolveItem(myOrder.value.uuid, item.uuid, 'accept', quantity)
        myOrder.value = response.data
        syncResolveQuantities()
        toast.add({ title: 'Item confirmed', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to confirm', description: (error as APIError).message, color: 'error' })
    } finally {
        resolvingItem.value = null
    }
}

async function removeItem(item: MyOrderItem) {
    if (!myOrder.value) return
    resolvingItem.value = item.uuid
    try {
        const response = await customerOrderService.resolveItem(myOrder.value.uuid, item.uuid, 'remove')
        myOrder.value = response.data
        syncResolveQuantities()
        toast.add({ title: 'Item removed', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to remove item', description: (error as APIError).message, color: 'error' })
    } finally {
        resolvingItem.value = null
    }
}

async function cancelOrder() {
    if (!myOrder.value) return
    cancellingOrder.value = true
    try {
        await customerOrderService.cancelOrder(myOrder.value.uuid)
        myOrder.value = null
        confirmingCancel.value = false
        toast.add({ title: 'Order cancelled', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to cancel', description: (error as APIError).message, color: 'error' })
    } finally {
        cancellingOrder.value = false
    }
}

function startEditOrder() {
    if (!myOrder.value) return
    for (const product of catalog.value) {
        quantities.value[product.uuid] = 0
    }
    for (const item of myOrder.value.items) {
        quantities.value[item.product_uuid] = item.quantity
        getPreference(item.product_uuid).max_price = item.max_price !== null ? Number(item.max_price) : null
        getPreference(item.product_uuid).auto_buy_if_under_max = item.auto_buy_if_under_max
    }
    submitError.value = null
    editingOrder.value = true
}

function cancelEditOrder() {
    editingOrder.value = false
    submitError.value = null
}

function increment(product: Product) {
    const current = quantities.value[product.uuid] || 0
    quantities.value[product.uuid] = current + 1
}

function decrement(product: Product) {
    const current = quantities.value[product.uuid] || 0
    quantities.value[product.uuid] = Math.max(0, current - 1)
}

async function submitOrder() {
    submitError.value = null
    submitting.value = true
    try {
        const items = Object.entries(quantities.value)
            .filter(([, qty]) => qty > 0)
            .map(([product_uuid, quantity]) => {
                const preference = getPreference(product_uuid)
                return {
                    product_uuid,
                    quantity,
                    max_price: preference.auto_buy_if_under_max && preference.max_price !== null ? preference.max_price : undefined,
                    auto_buy_if_under_max: preference.auto_buy_if_under_max
                }
            })

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
