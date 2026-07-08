<template>
    <div v-if="schedule" class="space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">{{ schedule.title }}</h1>
            <div class="mt-2 flex items-center gap-2">
                <UInput :model-value="publicLink" readonly class="w-full sm:w-96" />
                <UButton icon="i-lucide-copy" color="neutral" variant="soft" @click="copyLink">Copy link</UButton>
            </div>
        </div>

        <UTabs :items="tabs" class="w-full">
            <template #details>
                <UCard class="mt-4">
                    <UAlert
                        v-if="isClosed"
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-lock"
                        title="This schedule is closed"
                        description="Change the status below and save to reopen it before making other changes."
                        class="max-w-lg mb-4"
                    />
                    <form class="max-w-lg space-y-4" @submit.prevent="saveDetails">
                        <UFormField label="Title" required>
                            <UInput v-model="detailsForm.title" :disabled="isClosed" class="w-full" />
                        </UFormField>
                        <UFormField label="Description">
                            <UTextarea v-model="detailsForm.description" :disabled="isClosed" class="w-full" />
                        </UFormField>
                        <UFormField label="Cutoff (optional)">
                            <UInput v-model="detailsForm.cutoffAt" type="datetime-local" :disabled="isClosed" class="w-full" />
                        </UFormField>
                        <UFormField label="Status">
                            <USelect
                                v-model="detailsForm.status"
                                :items="[
                                    { label: 'Draft', value: 'draft' },
                                    { label: 'Open', value: 'open' },
                                    { label: 'Closed', value: 'closed' }
                                ]"
                                value-key="value"
                                class="w-48"
                            />
                        </UFormField>
                        <UButton type="submit" :loading="savingDetails" :disabled="isClosed && detailsForm.status === 'closed'">
                            Save details
                        </UButton>
                    </form>
                </UCard>
            </template>

            <template #products>
                <UAlert
                    v-if="isClosed"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-lock"
                    title="This schedule is closed"
                    description="Reopen it from the Details tab to change its products."
                    class="mt-4"
                />

                <div class="mt-4 flex justify-end">
                    <UButton :loading="savingProducts" :disabled="isClosed" @click="saveProducts">Save products</UButton>
                </div>

                <div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <template #header>
                            <div class="flex items-center justify-between gap-3">
                                <h3 class="font-medium">Catalog</h3>
                                <UInput v-model="productSearch" icon="i-lucide-search" placeholder="Search…" class="w-40 sm:w-56" />
                            </div>
                        </template>

                        <div class="max-h-112 divide-y divide-default overflow-y-auto">
                            <div v-for="product in availableProducts" :key="product.uuid" class="flex items-center gap-3 p-3">
                                <img
                                    v-if="product.image_url"
                                    :src="product.image_url"
                                    class="size-10 rounded-lg object-cover ring-1 ring-default"
                                    alt=""
                                >
                                <div v-else class="flex items-center justify-center size-10 rounded-lg bg-elevated text-dimmed">
                                    <UIcon name="i-lucide-image" class="size-4" />
                                </div>
                                <span class="flex-1 truncate font-medium text-highlighted">{{ product.name }}</span>
                                <UButton
                                    icon="i-lucide-plus"
                                    size="xs"
                                    color="neutral"
                                    variant="soft"
                                    :disabled="isClosed"
                                    @click="addProduct(product.uuid)"
                                >
                                    Add
                                </UButton>
                            </div>

                            <div v-if="availableProducts.length === 0" class="flex flex-col items-center gap-3 py-10">
                                <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                                <p class="text-sm text-muted">
                                    {{ catalog.length === 0 ? 'No products in your catalog yet.' : 'No matching products.' }}
                                </p>
                            </div>
                        </div>
                    </UCard>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <template #header>
                            <div class="flex items-center justify-between gap-3">
                                <h3 class="font-medium">In this schedule</h3>
                                <span class="text-sm text-muted">{{ selectedProducts.length }} added</span>
                            </div>
                        </template>

                        <div class="max-h-112 divide-y divide-default overflow-y-auto">
                            <div v-for="{ product, entry, scheduleProduct } in selectedProducts" :key="product.uuid" class="p-3">
                                <div class="flex items-center gap-3">
                                    <img
                                        v-if="product.image_url"
                                        :src="product.image_url"
                                        class="size-10 rounded-lg object-cover ring-1 ring-default"
                                        alt=""
                                    >
                                    <div v-else class="flex items-center justify-center size-10 rounded-lg bg-elevated text-dimmed">
                                        <UIcon name="i-lucide-image" class="size-4" />
                                    </div>
                                    <span class="flex-1 truncate font-medium text-highlighted">{{ product.name }}</span>
                                    <UButton
                                        icon="i-lucide-x"
                                        size="xs"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Remove product"
                                        :disabled="isClosed"
                                        @click="removeProduct(product.uuid)"
                                    />
                                </div>
                                <div class="mt-3 grid grid-cols-2 gap-3">
                                    <UFormField label="Estimated price">
                                        <UInput
                                            v-model.number="entry.estimated_price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            :disabled="isClosed"
                                            class="w-full"
                                        >
                                            <template #leading>
                                                <span class="text-sm text-dimmed">₱</span>
                                            </template>
                                        </UInput>
                                    </UFormField>
                                    <UFormField label="Max qty">
                                        <UInput
                                            v-model.number="entry.max_quantity"
                                            type="number"
                                            min="1"
                                            placeholder="Unlimited"
                                            :disabled="isClosed"
                                            class="w-full"
                                        />
                                    </UFormField>
                                </div>

                                <div v-if="scheduleProduct && canConfirmPrice" class="mt-3 border-t border-default pt-3">
                                    <div class="mb-2 flex items-center justify-between gap-2">
                                        <span class="text-xs font-medium uppercase tracking-wide text-dimmed">In-store price</span>
                                        <UBadge v-if="scheduleProduct.price_confirmed_at" color="success" variant="subtle" size="sm">
                                            Confirmed
                                        </UBadge>
                                    </div>
                                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                                        <UFormField label="Actual price">
                                            <UInput
                                                v-model.number="getConfirmForm(scheduleProduct.uuid).actual_price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                :disabled="getConfirmForm(scheduleProduct.uuid).promo_status === 'out_of_stock'"
                                                class="w-full"
                                            >
                                                <template #leading>
                                                    <span class="text-sm text-dimmed">₱</span>
                                                </template>
                                            </UInput>
                                        </UFormField>
                                        <UFormField label="Promo">
                                            <USelect
                                                v-model="getConfirmForm(scheduleProduct.uuid).promo_status"
                                                :items="promoStatusOptions"
                                                value-key="value"
                                                class="w-full"
                                            />
                                        </UFormField>
                                        <UButton
                                            size="sm"
                                            :loading="getConfirmForm(scheduleProduct.uuid).saving"
                                            @click="confirmPrice(scheduleProduct.uuid)"
                                        >
                                            Confirm
                                        </UButton>
                                    </div>
                                </div>
                            </div>

                            <div v-if="selectedProducts.length === 0" class="flex flex-col items-center gap-3 py-10">
                                <UIcon name="i-lucide-shopping-basket" class="size-8 text-dimmed" />
                                <p class="text-sm text-muted">No products added yet.</p>
                                <p class="text-xs text-dimmed">Add some from the catalog on the left.</p>
                            </div>
                        </div>
                    </UCard>
                </div>
            </template>

            <template #orders>
                <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
                    <UTable :data="orders" :columns="orderColumns" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                        <template #status-cell="{ row }">
                            <UBadge :color="orderStatusColor[row.original.status]" variant="subtle">
                                {{ row.original.status }}
                            </UBadge>
                        </template>
                        <template #actions-cell="{ row }">
                            <div class="flex items-center justify-end gap-2">
                                <template v-if="row.original.status === 'pending'">
                                    <UButton
                                        v-if="isClosed"
                                        size="xs"
                                        color="success"
                                        variant="soft"
                                        @click="setOrderStatus(row.original, 'confirmed')"
                                    >
                                        Confirm
                                    </UButton>
                                    <span v-else class="text-xs text-dimmed">Close schedule to confirm</span>
                                    <UButton
                                        size="xs"
                                        color="error"
                                        variant="soft"
                                        @click="setOrderStatus(row.original, 'cancelled')"
                                    >
                                        Cancel
                                    </UButton>
                                </template>
                                <span v-else-if="row.original.status === 'needs_confirmation'" class="text-xs text-dimmed">
                                    Waiting on customer
                                </span>
                                <UButton
                                    icon="i-lucide-eye"
                                    size="xs"
                                    color="neutral"
                                    variant="ghost"
                                    aria-label="View order"
                                    @click="viewOrder(row.original)"
                                />
                            </div>
                        </template>
                        <template #empty>
                            <div class="flex flex-col items-center gap-3 py-10">
                                <UIcon name="i-lucide-receipt" class="size-8 text-dimmed" />
                                <p class="text-sm text-muted">No orders yet.</p>
                            </div>
                        </template>
                    </UTable>
                </UCard>
            </template>
        </UTabs>

        <UModal v-model:open="isOrderModalOpen" title="Order details">
            <template #body>
                <div v-if="viewingOrder" class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-highlighted">{{ viewingOrder.customer_name }}</p>
                            <p class="text-sm text-muted">{{ viewingOrder.customer_contact }}</p>
                        </div>
                        <UBadge :color="orderStatusColor[viewingOrder.status]" variant="subtle">
                            {{ viewingOrder.status }}
                        </UBadge>
                    </div>

                    <div class="divide-y divide-default rounded-lg border border-default">
                        <div
                            v-for="item in viewingOrder.items"
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
                        <span>₱{{ viewingOrder.total_amount }}</span>
                    </div>

                    <p class="text-xs text-dimmed">Placed {{ formatDate(viewingOrder.created_at) }}</p>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import { productService } from '@/components/api/admin/ProductService'
import APIError from '@/components/api/user/APIError'
import type { TableColumn, TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Product {
    uuid: string
    name: string
    image_url: string | null
}

interface ScheduleProduct {
    uuid: string
    estimated_price: string
    actual_price: string | null
    promo_status: 'none' | 'b1t1' | 'out_of_stock'
    price_confirmed_at: string | null
    max_quantity: number | null
    product: Product
}

interface Schedule {
    uuid: string
    title: string
    description: string | null
    cutoff_at: string | null
    status: 'draft' | 'open' | 'closed'
    is_open: boolean
    products: ScheduleProduct[]
}

interface OrderItem {
    uuid: string
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

interface Order {
    uuid: string
    customer_name: string
    customer_contact: string
    status: 'pending' | 'needs_confirmation' | 'confirmed' | 'cancelled'
    total_amount: string
    is_cancellable: boolean
    needs_confirmation_count: number
    items: OrderItem[]
    created_at: string
}

const route = useRoute()
const uuid = route.params.uuid as string
const toast = useToast()

const schedule = ref<Schedule | null>(null)
const catalog = ref<Product[]>([])
const orders = ref<Order[]>([])
const loading = ref(true)

const pendingOrderCount = computed(() =>
    orders.value.filter((o) => o.status === 'pending' || o.status === 'needs_confirmation').length
)
const isClosed = computed(() => schedule.value?.status === 'closed')

const tabs = computed<TabsItem[]>(() => [
    { label: 'Details', icon: 'i-lucide-file-text', value: 'details', slot: 'details' },
    { label: 'Products', icon: 'i-lucide-package', value: 'products', slot: 'products' },
    {
        label: 'Orders',
        icon: 'i-lucide-receipt',
        value: 'orders',
        slot: 'orders',
        badge: pendingOrderCount.value > 0 ? pendingOrderCount.value : undefined
    }
])

const detailsForm = reactive({
    title: '',
    description: '',
    cutoffAt: '',
    status: 'draft' as Schedule['status']
})
const savingDetails = ref(false)

function isoToDatetimeLocal(iso: string | null): string {
    if (!iso) return ''
    const date = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface SelectionEntry {
    selected: boolean
    estimated_price: number | null
    max_quantity: number | null
}

const selection = ref<Record<string, SelectionEntry>>({})
const savingProducts = ref(false)
const productSearch = ref('')

const availableProducts = computed(() => {
    const query = productSearch.value.trim().toLowerCase()
    return catalog.value.filter((product) => {
        if (selection.value[product.uuid]?.selected) return false
        return !query || product.name.toLowerCase().includes(query)
    })
})

const selectedProducts = computed(() =>
    catalog.value.flatMap((product) => {
        const entry = selection.value[product.uuid]
        if (!entry?.selected) return []
        const scheduleProduct = schedule.value?.products.find((sp) => sp.product.uuid === product.uuid) ?? null
        return [{ product, entry, scheduleProduct }]
    })
)

interface ConfirmPriceForm {
    actual_price: number | null
    promo_status: 'none' | 'b1t1' | 'out_of_stock'
    saving: boolean
}

const confirmForms = reactive<Record<string, ConfirmPriceForm>>({})
const canConfirmPrice = computed(() => schedule.value?.status !== 'draft')
const promoStatusOptions = [
    { label: 'None', value: 'none' },
    { label: 'B1T1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' }
]

function syncConfirmForms() {
    for (const sp of schedule.value?.products ?? []) {
        confirmForms[sp.uuid] = {
            actual_price: sp.actual_price !== null ? Number(sp.actual_price) : null,
            promo_status: sp.promo_status,
            saving: false
        }
    }
}

function getConfirmForm(scheduleProductUuid: string): ConfirmPriceForm {
    return confirmForms[scheduleProductUuid] ??= { actual_price: null, promo_status: 'none', saving: false }
}

function addProduct(productUuid: string) {
    selection.value[productUuid]!.selected = true
}

function removeProduct(productUuid: string) {
    selection.value[productUuid]!.selected = false
}

const publicLink = computed(() => {
    if (!import.meta.client) return ''
    return `${window.location.origin}/pasabuy/${uuid}`
})

async function loadAll() {
    loading.value = true
    try {
        const [scheduleResponse, catalogResponse, ordersResponse] = await Promise.all([
            pasabuyScheduleService.fetchSchedule(uuid),
            productService.fetchProducts({ per_page: 200 }),
            pasabuyScheduleService.fetchOrders(uuid)
        ])

        schedule.value = scheduleResponse.data
        catalog.value = catalogResponse.data.data
        orders.value = ordersResponse.data

        detailsForm.title = schedule.value!.title
        detailsForm.description = schedule.value!.description ?? ''
        detailsForm.cutoffAt = isoToDatetimeLocal(schedule.value!.cutoff_at)
        detailsForm.status = schedule.value!.status

        const initialSelection: typeof selection.value = {}
        for (const product of catalog.value) {
            const attached = schedule.value!.products.find((sp) => sp.product.uuid === product.uuid)
            initialSelection[product.uuid] = {
                selected: !!attached,
                estimated_price: attached ? Number(attached.estimated_price) : null,
                max_quantity: attached ? attached.max_quantity : null
            }
        }
        selection.value = initialSelection
        syncConfirmForms()
    } catch (error) {
        toast.add({ title: 'Failed to load schedule', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

async function saveDetails() {
    savingDetails.value = true
    try {
        const response = await pasabuyScheduleService.updateSchedule(uuid, {
            title: detailsForm.title,
            description: detailsForm.description,
            cutoff_at: detailsForm.cutoffAt || null,
            status: detailsForm.status
        })
        schedule.value = { ...schedule.value!, ...response.data }
        toast.add({ title: 'Schedule updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingDetails.value = false
    }
}

async function saveProducts() {
    savingProducts.value = true
    try {
        const products = Object.entries(selection.value)
            .filter(([, entry]) => entry.selected)
            .map(([product_uuid, entry]) => ({
                product_uuid,
                estimated_price: entry.estimated_price ?? 0,
                max_quantity: entry.max_quantity
            }))

        const response = await pasabuyScheduleService.syncProducts(uuid, products)
        schedule.value = response.data
        syncConfirmForms()
        toast.add({ title: 'Products updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingProducts.value = false
    }
}

async function refreshOrders() {
    const response = await pasabuyScheduleService.fetchOrders(uuid)
    orders.value = response.data
}

async function confirmPrice(scheduleProductUuid: string) {
    const form = confirmForms[scheduleProductUuid]
    if (!form) return

    form.saving = true
    try {
        const response = await pasabuyScheduleService.confirmProductPrice(uuid, scheduleProductUuid, {
            actual_price: form.promo_status === 'out_of_stock' ? undefined : (form.actual_price ?? undefined),
            promo_status: form.promo_status
        })

        const updated = response.data.schedule_product as ScheduleProduct
        const sp = schedule.value?.products.find((p) => p.uuid === scheduleProductUuid)
        if (sp) Object.assign(sp, updated)

        const summary = response.data.summary as { auto_applied: number, needs_confirmation: number, bonus_applied: number }
        const parts = [`${summary.auto_applied} auto-updated`, `${summary.needs_confirmation} need customer confirmation`]
        if (summary.bonus_applied > 0) parts.push(`${summary.bonus_applied} got a B1T1 bonus`)

        toast.add({ title: 'Price confirmed', description: parts.join(', '), color: 'success' })
        await refreshOrders()
    } catch (error) {
        toast.add({ title: 'Confirm failed', description: (error as APIError).message, color: 'error' })
    } finally {
        form.saving = false
    }
}

async function copyLink() {
    await navigator.clipboard.writeText(publicLink.value)
    toast.add({ title: 'Link copied', color: 'success' })
}

async function setOrderStatus(order: Order, status: 'confirmed' | 'cancelled') {
    try {
        await pasabuyScheduleService.updateOrderStatus(order.uuid, status)
        order.status = status
        toast.add({ title: `Order ${status}`, color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    }
}

const isOrderModalOpen = ref(false)
const viewingOrder = ref<Order | null>(null)

function viewOrder(order: Order) {
    viewingOrder.value = order
    isOrderModalOpen.value = true
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const orderColumns: TableColumn<Order>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'customer_contact', header: 'Contact' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { id: 'actions', header: '' }
]

const orderStatusColor: Record<string, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending: 'neutral',
    needs_confirmation: 'warning',
    confirmed: 'success',
    cancelled: 'error'
}

onMounted(loadAll)
</script>
