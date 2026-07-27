<template>
    <div class="min-h-screen bg-default px-4 py-8" :class="{ 'pb-32 lg:pb-8': showBottomBar }">
        <div class="mx-auto max-w-2xl space-y-6 lg:max-w-5xl lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8 lg:space-y-0">
        <div class="space-y-6">
            <Transition
                enter-active-class="transition-opacity duration-300"
                leave-active-class="transition-opacity duration-300"
                enter-from-class="opacity-0"
                leave-to-class="opacity-0"
            >
                <SplashScreen v-if="loading" />
            </Transition>

            <UAlert v-if="!loading && notFound" color="error" variant="subtle" title="Pasabuy not found" description="This link doesn't point to a valid pasabuy." />

            <template v-else-if="schedule">
                <BaseButton
                    v-if="isLoggedIn"
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-arrow-left"
                    to="/customer"
                    class="-ml-2"
                >
                    Browse Pasabuys
                </BaseButton>

                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0">
                        <h1 class="text-2xl font-semibold text-highlighted">{{ schedule.title }}</h1>
                        <p v-if="schedule.description" class="mt-1 text-muted">{{ schedule.description }}</p>
                        <div v-if="schedule.pasabuy_schedule_date" class="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
                            <span class="inline-flex items-center gap-1.5">
                                <UIcon name="i-lucide-alarm-clock" class="size-4 text-dimmed" />
                                Close by {{ formatDate(schedule.pasabuy_schedule_date) }}
                            </span>
                        </div>
                    </div>
                    <BaseButton v-if="isLoggedIn" size="sm" color="neutral" variant="soft" icon="i-lucide-receipt" to="/customer/orders" class="self-start">
                        My Orders
                    </BaseButton>
                </div>

                <UAlert
                    v-if="!schedule.is_open"
                    color="warning"
                    variant="subtle"
                    title="This pasabuy is closed"
                    description="Ordering is no longer available for this pasabuy."
                />

                <UCard v-if="myOrder && !editingOrder">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="font-medium">Your order</h2>
                            <OrderStatusBadge :status="myOrder.status" />
                        </div>
                    </template>

                    <div class="divide-y divide-default">
                        <div v-for="item in myOrder.items" :key="item.uuid" class="py-3 first:pt-0 last:pb-0">
                            <OrderLineItem :item="item" />
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex items-center justify-between gap-3">
                            <p class="font-semibold text-highlighted">Total: ₱{{ myOrder.total_amount }}</p>
                            <div class="flex items-center gap-2">
                                <BaseButton v-if="myOrder.is_editable" variant="soft" icon="i-lucide-pencil" @click="startEditOrder">
                                    Edit order
                                </BaseButton>
                                <CancelOrderControl v-if="myOrder.is_cancellable" :loading="cancellingOrder" @confirm="cancelOrder" />
                                <p v-if="!myOrder.is_editable && !myOrder.is_cancellable" class="text-sm text-muted">
                                    This order can no longer be edited.
                                </p>
                            </div>
                        </div>
                    </template>
                </UCard>

                <template v-if="!myOrder || editingOrder">
                    <UTabs
                        v-if="categoryTabs.length > 2"
                        v-model="selectedCategory"
                        :items="categoryTabs"
                        variant="pill"
                        size="md"
                        class="hidden w-full lg:flex"
                        :ui="{ list: 'flex-nowrap overflow-x-auto', trigger: 'grow-0 shrink-0 min-w-20 justify-center py-2.5' }"
                    />

                    <div v-if="catalogItems.length > 5" class="sticky top-0 z-10 -mx-4 space-y-2 bg-default/95 px-4 py-2 backdrop-blur-sm">
                        <div class="flex items-center gap-2">
                            <UInput
                                v-model="productSearch"
                                icon="i-lucide-search"
                                placeholder="Search items…"
                                class="flex-1"
                                :ui="{ base: 'h-11' }"
                            />
                            <BaseButton
                                class="sm:hidden shrink-0"
                                color="neutral"
                                variant="outline"
                                icon="i-lucide-list-filter"
                                @click="isFiltersOpen = true"
                            >
                                Filters
                                <UBadge v-if="activeFilterCount" color="primary" variant="subtle" size="sm">{{ activeFilterCount }}</UBadge>
                            </BaseButton>
                        </div>
                        <div class="hidden sm:grid grid-cols-4 gap-2">
                            <USelect
                                v-model="statusFilter"
                                :items="statusFilterOptions"
                                value-key="value"
                                placeholder="Status"
                                class="w-full h-11"
                            />
                            <USelect
                                v-model="sortByPrice"
                                :items="sortByPriceOptions"
                                value-key="value"
                                placeholder="Sort by price"
                                class="w-full h-11"
                            />
                            <UInput
                                v-model.number="priceMin"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Min price"
                                class="w-full"
                                :ui="{ base: 'h-11' }"
                            />
                            <UInput
                                v-model.number="priceMax"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Max price"
                                class="w-full"
                                :ui="{ base: 'h-11' }"
                            />
                        </div>

                        <USlideover v-model:open="isFiltersOpen" side="bottom" title="Filters">
                            <template #body>
                                <div class="space-y-4">
                                    <UFormField label="Status">
                                        <USelect v-model="statusFilter" :items="statusFilterOptions" value-key="value" class="w-full" />
                                    </UFormField>
                                    <UFormField label="Sort by price">
                                        <USelect v-model="sortByPrice" :items="sortByPriceOptions" value-key="value" class="w-full" />
                                    </UFormField>
                                    <div class="grid grid-cols-2 gap-4">
                                        <UFormField label="Min price">
                                            <UInput v-model.number="priceMin" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" />
                                        </UFormField>
                                        <UFormField label="Max price">
                                            <UInput v-model.number="priceMax" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" />
                                        </UFormField>
                                    </div>
                                </div>
                            </template>
                            <template #footer>
                                <div class="w-full flex items-center gap-2">
                                    <BaseButton class="flex-1" color="neutral" variant="outline" @click="clearFilters">Clear filters</BaseButton>
                                    <BaseButton class="flex-1" @click="isFiltersOpen = false">Done</BaseButton>
                                </div>
                            </template>
                        </USlideover>
                    </div>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h2 class="font-medium">{{ editingOrder ? 'Edit your items' : 'Items' }}</h2>
                                <BaseButton v-if="editingOrder" size="xs" color="neutral" variant="ghost" @click="cancelEditOrder">
                                    Cancel
                                </BaseButton>
                            </div>
                        </template>

                        <div class="divide-y divide-default">
                            <div
                                v-for="product in filteredProducts"
                                :key="product.uuid"
                                class="flex items-center gap-4 p-4"
                            >
                                <button
                                    type="button"
                                    class="shrink-0 cursor-pointer"
                                    :aria-label="`View details for ${product.name}`"
                                    @click="openPreview(product)"
                                >
                                    <img
                                        v-if="product.image_url && !imageLoadFailed[product.uuid]"
                                        :src="product.image_url"
                                        loading="lazy"
                                        width="56"
                                        height="56"
                                        class="size-14 rounded-lg object-cover transition hover:opacity-80"
                                        alt=""
                                        @error="onImageError(product.uuid)"
                                    >
                                    <div v-else class="flex size-14 items-center justify-center rounded-lg bg-elevated text-dimmed transition hover:opacity-80">
                                        <UIcon name="i-lucide-image" class="size-5" />
                                    </div>
                                </button>

                                <div class="min-w-0 flex-1">
                                    <p class="truncate font-medium text-highlighted">{{ product.name }}</p>

                                    <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <p class="text-sm text-muted">
                                            ₱{{ resolvedPrice(product) }}
                                            <span class="text-xs text-dimmed">{{ isPriceConfirmed(product) ? 'confirmed' : 'estimated' }}</span>
                                        </p>
                                        <UBadge v-if="resolvedStatus(product) === 'b1t1'" color="success" variant="outline" size="sm" icon="i-lucide-check">
                                            B1T1
                                        </UBadge>
                                    </div>

                                    <div class="mt-2">
                                        <span v-if="resolvedStatus(product) === 'out_of_stock'" class="text-sm font-medium text-error">
                                            Out of stock
                                        </span>
                                        <div v-else class="flex flex-wrap items-center gap-3">
                                            <BaseQuantityInput
                                                :model-value="quantities[product.uuid] || 0"
                                                :min="0"
                                                size="sm"
                                                :color="quantities[product.uuid] ? 'primary' : 'neutral'"
                                                :variant="quantities[product.uuid] ? 'subtle' : 'ghost'"
                                                class="w-24"
                                                :disabled="!schedule.is_open"
                                                :aria-label="`Quantity for ${product.name}`"
                                                @update:model-value="(value: number | null) => setQuantity(product, value)"
                                            />
                                            <p v-if="quantities[product.uuid]" class="text-sm font-semibold text-primary">
                                                ₱{{ (Number(resolvedPrice(product)) * quantities[product.uuid]!).toFixed(2) }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div v-if="filteredProducts.length === 0" class="flex flex-col items-center gap-3 py-10">
                                <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                                <p class="text-sm text-muted">
                                    {{ catalogItems.length === 0 ? 'No items available yet.' : 'No items match your search.' }}
                                </p>
                            </div>
                        </div>
                    </UCard>
                </template>

            </template>
        </div>

        <aside v-if="showBottomBar" class="hidden lg:sticky lg:top-8 lg:block">
            <UCard>
                <template #header>
                    <h2 class="font-medium">Order summary</h2>
                </template>

                <template v-if="!isLoggedIn">
                    <p class="text-sm text-muted">Log in to place an order.</p>
                    <div class="mt-3 flex gap-2">
                        <BaseButton color="neutral" variant="soft" :to="`/register?redirect=${encodeURIComponent(route.fullPath)}`">
                            Sign up
                        </BaseButton>
                        <BaseButton :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`">
                            Log in
                        </BaseButton>
                    </div>
                </template>

                <template v-else-if="!isApproved">
                    <p class="text-sm text-warning">Your account is pending admin approval before you can order.</p>
                </template>

                <template v-else>
                    <UAlert v-if="submitError" color="error" variant="subtle" :title="submitError" class="mb-3" />
                    <p class="text-xs text-muted">{{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}</p>
                    <p class="text-2xl font-semibold text-highlighted">₱{{ total.toFixed(2) }}</p>
                    <BaseButton
                        block
                        class="mt-3"
                        size="lg"
                        :loading="submitting"
                        :disabled="!schedule?.is_open || !hasItems"
                        @click="submitOrder"
                    >
                        {{ editingOrder ? 'Update order' : 'Place order' }}
                    </BaseButton>
                </template>
            </UCard>
        </aside>
        </div>

        <div v-if="showBottomBar" class="fixed inset-x-0 bottom-0 z-10 border-t border-default bg-muted/95 shadow-[0_-2px_10px_-4px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden">
            <UTabs
                v-if="categoryTabs.length > 2"
                v-model="selectedCategory"
                :items="categoryTabs"
                variant="pill"
                size="md"
                class="w-full border-b border-default"
                :ui="{ root: 'px-4 py-3', list: 'flex-nowrap overflow-x-auto', trigger: 'grow-0 shrink-0 min-w-20 justify-center py-2.5' }"
            />

            <div class="mx-auto max-w-2xl space-y-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <template v-if="!isLoggedIn">
                    <div class="flex items-center justify-between gap-3">
                        <p class="text-sm text-muted">Log in to place an order.</p>
                        <div class="flex shrink-0 gap-2">
                            <BaseButton size="sm" color="neutral" variant="soft" :to="`/register?redirect=${encodeURIComponent(route.fullPath)}`">
                                Sign up
                            </BaseButton>
                            <BaseButton size="sm" :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`">
                                Log in
                            </BaseButton>
                        </div>
                    </div>
                </template>

                <template v-else-if="!isApproved">
                    <p class="text-sm text-warning">Your account is pending admin approval before you can order.</p>
                </template>

                <template v-else>
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-xs text-muted">{{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}</p>
                            <p class="text-lg font-semibold text-highlighted">₱{{ total.toFixed(2) }}</p>
                        </div>
                        <BaseButton
                            size="lg"
                            icon="i-lucide-shopping-cart"
                            :disabled="!schedule?.is_open || !hasItems"
                            @click="isCartOpen = true"
                        >
                            View cart
                        </BaseButton>
                    </div>
                </template>
            </div>
        </div>

        <BaseModal v-model:open="isPreviewOpen" :title="previewProduct?.name" view-only>
            <img
                v-if="previewProduct?.image_url && !imageLoadFailed[previewProduct.uuid]"
                :src="previewProduct.image_url"
                class="max-h-[70vh] w-full rounded-lg object-contain"
                :alt="previewProduct.name"
                @error="onImageError(previewProduct!.uuid)"
            >
            <div v-else class="flex h-40 items-center justify-center rounded-lg bg-elevated text-dimmed">
                <UIcon name="i-lucide-image-off" class="size-8" />
            </div>
        </BaseModal>

        <USlideover
            v-model:open="isCartOpen"
            side="bottom"
            title="Your cart"
            :description="`${itemCount} item${itemCount === 1 ? '' : 's'}`"
        >
            <template #body>
                <div v-if="cartItems.length === 0" class="flex flex-col items-center gap-3 py-10">
                    <UIcon name="i-lucide-shopping-cart" class="size-8 text-dimmed" />
                    <p class="text-sm text-muted">Your cart is empty.</p>
                </div>

                <div v-else class="divide-y divide-default">
                    <div v-for="product in cartItems" :key="product.uuid" class="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                        <img
                            v-if="product.image_url && !imageLoadFailed[product.uuid]"
                            :src="product.image_url"
                            loading="lazy"
                            class="size-12 shrink-0 rounded-lg object-cover"
                            alt=""
                            @error="onImageError(product.uuid)"
                        >
                        <div v-else class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-elevated text-dimmed">
                            <UIcon name="i-lucide-image" class="size-5" />
                        </div>

                        <div class="min-w-0 flex-1">
                            <p class="truncate font-medium text-highlighted">{{ product.name }}</p>
                            <p class="text-sm font-medium text-primary">
                                ₱{{ (Number(resolvedPrice(product)) * quantities[product.uuid]!).toFixed(2) }}
                            </p>
                        </div>

                        <div class="flex shrink-0 items-center gap-2">
                            <BaseButton
                                icon="i-lucide-minus"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                :aria-label="`Decrease quantity for ${product.name}`"
                                :disabled="!schedule?.is_open"
                                @click="decrement(product)"
                            />
                            <span class="w-6 text-center font-medium">{{ quantities[product.uuid] || 0 }}</span>
                            <BaseButton
                                icon="i-lucide-plus"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                :aria-label="`Increase quantity for ${product.name}`"
                                :disabled="!schedule?.is_open"
                                @click="increment(product)"
                            />
                        </div>
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="w-full space-y-3">
                    <UAlert v-if="submitError" color="error" variant="subtle" :title="submitError" />
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-muted">Total</p>
                        <p class="text-lg font-semibold text-highlighted">₱{{ total.toFixed(2) }}</p>
                    </div>
                    <BaseButton
                        block
                        size="lg"
                        :loading="submitting"
                        :disabled="!schedule?.is_open || !hasItems"
                        @click="submitOrder"
                    >
                        {{ editingOrder ? 'Update order' : 'Place order' }}
                    </BaseButton>
                </div>
            </template>
        </USlideover>
    </div>
</template>

<script setup lang="ts">
import { publicPasabuyService } from '@/components/api/public/PublicPasabuyService'
import { publicProductService } from '@/components/api/public/PublicProductService'
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'
import type { Schedule, ScheduleProduct } from '@/types/Schedule'

definePageMeta({ layout: false })

interface MyOrderItem {
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

interface MyOrder {
    uuid: string
    status: 'pending' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    is_cancellable: boolean
    items: MyOrderItem[]
    pasabuy_schedule: { uuid: string } | null
}

const route = useRoute()
const uuid = route.params.uuid as string
const toast = useToast()
const { user, fetchCurrentUser } = useAuth()

const schedule = ref<Schedule | null>(null)
const { data: catalog, ensure: ensureCatalogLoaded } = useCachedFetch<Product[]>(
    'public-product-catalog',
    (etag) => publicProductService.fetchCatalogCacheable({ per_page: 200 }, etag)
)
const loading = ref(true)
const notFound = ref(false)

useHead({ title: computed(() => schedule.value?.title ?? 'Pasabuy Run') })
const productSearch = ref('')
const debouncedProductSearch = ref('')
useSearchDebounce(productSearch, () => {
    debouncedProductSearch.value = productSearch.value
})

const quantities = ref<Record<string, number>>({})
const selectedCategory = ref('all')
const statusFilter = ref('all')
const sortByPrice = ref('none')
const priceMin = ref<number | null>(null)
const priceMax = ref<number | null>(null)
const isCartOpen = ref(false)
const isFiltersOpen = ref(false)

const activeFilterCount = computed(() =>
    [statusFilter.value !== 'all', sortByPrice.value !== 'none', priceMin.value !== null, priceMax.value !== null]
        .filter(Boolean).length
)

function clearFilters() {
    statusFilter.value = 'all'
    sortByPrice.value = 'none'
    priceMin.value = null
    priceMax.value = null
}

const statusFilterOptions = [
    { label: 'All statuses', value: 'all' },
    { label: 'Buy 1 Take 1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' },
    { label: 'None', value: 'none' }
]

const sortByPriceOptions = [
    { label: 'Default order', value: 'none' },
    { label: 'Price: Low to High', value: 'asc' },
    { label: 'Price: High to Low', value: 'desc' }
]

const imageLoadFailed = ref<Record<string, boolean>>({})

function onImageError(productUuid: string) {
    imageLoadFailed.value[productUuid] = true
}

const submitting = ref(false)
const submitError = ref<string | null>(null)
const myOrder = ref<MyOrder | null>(null)
const myOrderEtag = ref<string | null>(null)
const editingOrder = ref(false)

const isLoggedIn = computed(() => !!user.value)
const isApproved = computed(() => user.value?.is_approved === true)

const showBottomBar = computed(() => !!schedule.value && (!myOrder.value || editingOrder.value))

const scheduleProductByUuid = computed(() => {
    const map = new Map<string, ScheduleProduct>()
    for (const scheduleProduct of schedule.value?.products ?? []) {
        if (scheduleProduct.product) map.set(scheduleProduct.product.uuid, scheduleProduct)
    }
    return map
})

function resolvedStatus(product: Product) {
    return scheduleProductByUuid.value.get(product.uuid)?.product_status ?? product.default_product_status
}

function resolvedPrice(product: Product): string {
    const scheduleProduct = scheduleProductByUuid.value.get(product.uuid)
    if (scheduleProduct?.actual_price !== null && scheduleProduct?.actual_price !== undefined) return scheduleProduct.actual_price
    return product.default_price
}

function isPriceConfirmed(product: Product): boolean {
    const scheduleProduct = scheduleProductByUuid.value.get(product.uuid)
    return scheduleProduct?.actual_price !== null && scheduleProduct?.actual_price !== undefined
}

const catalogItems = computed(() => catalog.value ?? [])

const categoryTabs = computed(() => {
    const seen = new Map<string, string>()
    for (const product of catalogItems.value) {
        if (product.category) seen.set(product.category.uuid, product.category.name)
    }
    const sorted = Array.from(seen, ([value, label]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label))
    return [{ label: 'All', value: 'all' }, ...sorted]
})

const filteredProducts = computed(() => {
    const query = debouncedProductSearch.value.trim().toLowerCase()
    const items = catalogItems.value.filter((product) => {
        if (query && !product.name.toLowerCase().includes(query)) return false
        if (selectedCategory.value !== 'all' && product.category?.uuid !== selectedCategory.value) return false
        if (statusFilter.value !== 'all' && resolvedStatus(product) !== statusFilter.value) return false
        const price = Number(resolvedPrice(product))
        if (priceMin.value !== null && price < priceMin.value) return false
        if (priceMax.value !== null && price > priceMax.value) return false
        return true
    })

    if (sortByPrice.value === 'none') return items

    return [...items].sort((a, b) => {
        const diff = Number(resolvedPrice(a)) - Number(resolvedPrice(b))
        return sortByPrice.value === 'asc' ? diff : -diff
    })
})

const cartItems = computed(() => catalogItems.value.filter((product) => (quantities.value[product.uuid] || 0) > 0))

const total = computed(() => {
    return catalogItems.value.reduce((sum, product) => {
        const qty = quantities.value[product.uuid] || 0
        return sum + qty * Number(resolvedPrice(product))
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

async function load(force = false) {
    loading.value = true
    try {
        const [scheduleResponse] = await Promise.all([
            publicPasabuyService.fetchSchedule(uuid),
            ensureCatalogLoaded(force)
        ])
        schedule.value = scheduleResponse.data
        for (const product of catalogItems.value) {
            if (quantities.value[product.uuid] === undefined) {
                quantities.value[product.uuid] = 0
            }
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
        // invalid/expired token: treat as logged out
    }
}

/**
 * Customers can only have one active (pending/confirmed) order per schedule:
 * find it, if any, so we show its summary instead of a fresh ordering form.
 */
async function loadMyOrder() {
    try {
        const result = await customerOrderService.fetchMyOrdersCacheable({ per_page: 100 }, myOrderEtag.value)
        if (result === 'not-modified') return
        const orders = result.data.items as MyOrder[]
        myOrder.value = orders.find((o) => o.pasabuy_schedule?.uuid === uuid && o.status !== 'cancelled') ?? null
        myOrderEtag.value = result.etag
    } catch {
        // non-critical, fall back to showing a fresh ordering form
    }
}

const cancellingOrder = ref(false)

async function cancelOrder() {
    if (!myOrder.value) return
    cancellingOrder.value = true
    try {
        await customerOrderService.cancelOrder(myOrder.value.uuid)
        myOrder.value = null
        toast.add({ title: 'Order cancelled', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to cancel', description: (error as APIError).message, color: 'error' })
    } finally {
        cancellingOrder.value = false
    }
}

function startEditOrder() {
    if (!myOrder.value) return
    for (const product of catalogItems.value) {
        quantities.value[product.uuid] = 0
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

function increment(product: Product) {
    const current = quantities.value[product.uuid] || 0
    quantities.value[product.uuid] = current + 1
}

function decrement(product: Product) {
    const current = quantities.value[product.uuid] || 0
    quantities.value[product.uuid] = Math.max(0, current - 1)
}

function setQuantity(product: Product, value: number | null) {
    quantities.value[product.uuid] = Math.max(0, Math.floor(value ?? 0))
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
            isCartOpen.value = false
            toast.add({ title: 'Order updated', color: 'success' })
        } else {
            const response = await customerOrderService.placeOrder(uuid, items)
            await navigateTo(`/customer/orders/${response.data.uuid}?placed=1`)
        }
    } catch (error) {
        submitError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        submitting.value = false
    }
}

let pollHandle: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
    await restoreSession()
    await load()
    if (isLoggedIn.value && isApproved.value) {
        await loadMyOrder()
        pollHandle = setInterval(() => {
            if (!editingOrder.value) loadMyOrder()
        }, 30000)
    }
})

onPullToRefresh(async () => {
    imageLoadFailed.value = {}
    await load(true)
    if (isLoggedIn.value && isApproved.value) {
        await loadMyOrder()
    }
})

onUnmounted(() => {
    if (pollHandle) clearInterval(pollHandle)
})
</script>
