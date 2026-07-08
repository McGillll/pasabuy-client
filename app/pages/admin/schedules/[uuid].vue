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
                    <div class="mb-4 flex flex-wrap items-center gap-3">
                        <UBadge :color="scheduleStatusColor[schedule.status]" variant="subtle" size="lg">
                            {{ schedule.status }}
                        </UBadge>
                        <UButton
                            v-if="schedule.status === 'open'"
                            size="sm"
                            color="neutral"
                            variant="soft"
                            :loading="changingStatus"
                            @click="closeSchedule"
                        >
                            Close schedule
                        </UButton>
                        <UButton
                            v-if="schedule.status === 'closed'"
                            size="sm"
                            color="neutral"
                            variant="soft"
                            :loading="changingStatus"
                            @click="reopenSchedule"
                        >
                            Reopen schedule
                        </UButton>
                    </div>

                    <UAlert
                        v-if="isClosed"
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-lock"
                        title="This schedule is closed"
                        description="Reopen it above to edit the title, description, or cutoff."
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
                        <UButton type="submit" :loading="savingDetails" :disabled="isClosed">
                            Save details
                        </UButton>
                    </form>
                </UCard>
            </template>

            <template #products>
                <div class="mt-4 flex justify-end">
                    <UButton :loading="savingProducts" @click="saveProducts">Save products</UButton>
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
                            <div v-for="{ product, scheduleProduct } in selectedProducts" :key="product.uuid" class="p-3">
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
                                    <div class="min-w-0 flex-1">
                                        <p class="truncate font-medium text-highlighted">{{ product.name }}</p>
                                        <p class="text-sm text-muted">₱{{ product.default_price }}</p>
                                    </div>
                                    <UButton
                                        icon="i-lucide-x"
                                        size="xs"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Remove product"
                                        @click="removeProduct(product.uuid)"
                                    />
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

            <template #summary>
                <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
                    <UTable :data="summary" :columns="summaryColumns" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                        <template #category_name-cell="{ row }">
                            <span class="text-sm text-muted">{{ row.original.category_name ?? '—' }}</span>
                        </template>
                        <template #default_price-cell="{ row }">
                            ₱{{ row.original.default_price }}
                        </template>
                        <template #subtotal-cell="{ row }">
                            ₱{{ row.original.subtotal }}
                        </template>
                        <template #empty>
                            <div class="flex flex-col items-center gap-3 py-10">
                                <UIcon name="i-lucide-clipboard-list" class="size-8 text-dimmed" />
                                <p class="text-sm text-muted">No orders yet — the checklist fills in once customers order.</p>
                            </div>
                        </template>
                    </UTable>
                    <template v-if="summary.length > 0" #footer>
                        <div class="flex items-center justify-between font-medium text-highlighted">
                            <span>Grand total</span>
                            <span>₱{{ summaryGrandTotal.toFixed(2) }}</span>
                        </div>
                    </template>
                </UCard>
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

                    <template v-if="canEditOrderItems">
                        <div class="space-y-2">
                            <div
                                v-for="editItem in editableItems"
                                :key="editItem.product_uuid"
                                class="flex items-center gap-3 rounded-lg border border-default p-3"
                            >
                                <span class="flex-1 truncate font-medium text-highlighted">{{ editItem.product_name }}</span>
                                <UInput v-model.number="editItem.quantity" type="number" min="1" size="sm" class="w-20" />
                                <UButton
                                    icon="i-lucide-x"
                                    size="xs"
                                    color="error"
                                    variant="ghost"
                                    aria-label="Remove item"
                                    @click="removeEditableItem(editItem.product_uuid)"
                                />
                            </div>

                            <div class="flex items-center gap-2">
                                <USelect
                                    v-model="itemToAdd"
                                    :items="addableProductOptions"
                                    value-key="value"
                                    placeholder="Add a product…"
                                    class="flex-1"
                                />
                                <UButton
                                    icon="i-lucide-plus"
                                    size="sm"
                                    color="neutral"
                                    variant="soft"
                                    :disabled="!itemToAdd"
                                    @click="addEditableItem"
                                >
                                    Add
                                </UButton>
                            </div>
                        </div>

                        <div class="flex justify-end">
                            <UButton :loading="savingOrderItems" @click="saveOrderItems">Save changes</UButton>
                        </div>
                    </template>

                    <div v-else class="divide-y divide-default rounded-lg border border-default">
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
import type { Product } from '@/types/Product'
import type { Schedule, ScheduleProduct, ScheduleSummaryItem } from '@/types/Schedule'
import type { Order } from '@/types/Order'
import type { TableColumn, TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const uuid = route.params.uuid as string
const toast = useToast()

const schedule = ref<Schedule | null>(null)
const catalog = ref<Product[]>([])
const orders = ref<Order[]>([])
const summary = ref<ScheduleSummaryItem[]>([])
const loading = ref(true)

const pendingOrderCount = computed(() =>
    orders.value.filter((o) => o.status === 'pending' || o.status === 'needs_confirmation').length
)
const isClosed = computed(() => schedule.value?.status === 'closed')

const scheduleStatusColor: Record<Schedule['status'], 'neutral' | 'success' | 'warning'> = {
    draft: 'neutral',
    open: 'success',
    closed: 'warning'
}

const tabs = computed<TabsItem[]>(() => [
    { label: 'Details', icon: 'i-lucide-file-text', value: 'details', slot: 'details' },
    { label: 'Products', icon: 'i-lucide-package', value: 'products', slot: 'products' },
    { label: 'Summary', icon: 'i-lucide-clipboard-list', value: 'summary', slot: 'summary' },
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
    cutoffAt: ''
})
const savingDetails = ref(false)
const changingStatus = ref(false)

function isoToDatetimeLocal(iso: string | null): string {
    if (!iso) return ''
    const date = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface SelectionEntry {
    selected: boolean
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
        return [{ product, scheduleProduct }]
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

const summaryColumns: TableColumn<ScheduleSummaryItem>[] = [
    { accessorKey: 'product_name', header: 'Product' },
    { id: 'category_name', header: 'Category' },
    { id: 'default_price', header: 'Price' },
    { accessorKey: 'total_quantity', header: 'Total qty' },
    { id: 'subtotal', header: 'Subtotal' }
]

const summaryGrandTotal = computed(() => summary.value.reduce((sum, item) => sum + Number(item.subtotal), 0))

async function loadAll() {
    loading.value = true
    try {
        const [scheduleResponse, catalogResponse, ordersResponse, summaryResponse] = await Promise.all([
            pasabuyScheduleService.fetchSchedule(uuid),
            productService.fetchProducts({ per_page: 200 }),
            pasabuyScheduleService.fetchOrders(uuid),
            pasabuyScheduleService.fetchScheduleSummary(uuid)
        ])

        schedule.value = scheduleResponse.data
        catalog.value = catalogResponse.data.data
        orders.value = ordersResponse.data
        summary.value = summaryResponse.data

        detailsForm.title = schedule.value!.title
        detailsForm.description = schedule.value!.description ?? ''
        detailsForm.cutoffAt = isoToDatetimeLocal(schedule.value!.cutoff_at)

        const initialSelection: typeof selection.value = {}
        for (const product of catalog.value) {
            const attached = schedule.value!.products.find((sp) => sp.product.uuid === product.uuid)
            initialSelection[product.uuid] = { selected: !!attached }
        }
        selection.value = initialSelection
        syncConfirmForms()
    } catch (error) {
        toast.add({ title: 'Failed to load schedule', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

async function refreshSummary() {
    const response = await pasabuyScheduleService.fetchScheduleSummary(uuid)
    summary.value = response.data
}

async function saveDetails() {
    savingDetails.value = true
    try {
        const response = await pasabuyScheduleService.updateSchedule(uuid, {
            title: detailsForm.title,
            description: detailsForm.description,
            cutoff_at: detailsForm.cutoffAt || null
        })
        schedule.value = { ...schedule.value!, ...response.data }
        toast.add({ title: 'Schedule updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingDetails.value = false
    }
}

async function closeSchedule() {
    if (!confirm('Close this schedule? Customers will no longer be able to order or edit their orders.')) return

    changingStatus.value = true
    try {
        const response = await pasabuyScheduleService.closeSchedule(uuid)
        schedule.value = { ...schedule.value!, ...response.data }
        toast.add({ title: 'Schedule closed', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to close schedule', description: (error as APIError).message, color: 'error' })
    } finally {
        changingStatus.value = false
    }
}

async function reopenSchedule() {
    if (!confirm('Reopen this schedule for customer orders?')) return

    changingStatus.value = true
    try {
        const response = await pasabuyScheduleService.reopenSchedule(uuid)
        schedule.value = { ...schedule.value!, ...response.data }
        toast.add({ title: 'Schedule reopened', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to reopen schedule', description: (error as APIError).message, color: 'error' })
    } finally {
        changingStatus.value = false
    }
}

async function saveProducts() {
    savingProducts.value = true
    try {
        const productUuids = Object.entries(selection.value)
            .filter(([, entry]) => entry.selected)
            .map(([product_uuid]) => product_uuid)

        const response = await pasabuyScheduleService.syncProducts(uuid, productUuids)
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

        const priceSummary = response.data.summary as { auto_applied: number, needs_confirmation: number, bonus_applied: number }
        const parts = [`${priceSummary.auto_applied} auto-updated`, `${priceSummary.needs_confirmation} need customer confirmation`]
        if (priceSummary.bonus_applied > 0) parts.push(`${priceSummary.bonus_applied} got a B1T1 bonus`)

        toast.add({ title: 'Price confirmed', description: parts.join(', '), color: 'success' })
        await Promise.all([refreshOrders(), refreshSummary()])
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
const canEditOrderItems = computed(() => isClosed.value)

interface EditableItem {
    product_uuid: string
    product_name: string
    quantity: number
}

const editableItems = ref<EditableItem[]>([])
const itemToAdd = ref<string | undefined>(undefined)
const savingOrderItems = ref(false)

const addableProductOptions = computed(() => {
    const usedUuids = new Set(editableItems.value.map((item) => item.product_uuid))
    return (schedule.value?.products ?? [])
        .filter((sp) => !usedUuids.has(sp.product.uuid))
        .map((sp) => ({ label: sp.product.name, value: sp.product.uuid }))
})

function viewOrder(order: Order) {
    viewingOrder.value = order
    editableItems.value = order.items
        .filter((item) => !item.is_bonus && item.product_uuid)
        .map((item) => ({ product_uuid: item.product_uuid!, product_name: item.product_name, quantity: item.quantity }))
    itemToAdd.value = undefined
    isOrderModalOpen.value = true
}

function removeEditableItem(productUuid: string) {
    editableItems.value = editableItems.value.filter((item) => item.product_uuid !== productUuid)
}

function addEditableItem() {
    if (!itemToAdd.value) return
    const sp = schedule.value?.products.find((p) => p.product.uuid === itemToAdd.value)
    if (!sp) return

    editableItems.value.push({ product_uuid: sp.product.uuid, product_name: sp.product.name, quantity: 1 })
    itemToAdd.value = undefined
}

async function saveOrderItems() {
    if (!viewingOrder.value) return

    savingOrderItems.value = true
    try {
        const response = await pasabuyScheduleService.updateOrderItems(
            uuid,
            viewingOrder.value.uuid,
            editableItems.value.map((item) => ({ product_uuid: item.product_uuid, quantity: item.quantity }))
        )
        viewingOrder.value = response.data
        const row = orders.value.find((o) => o.uuid === response.data.uuid)
        if (row) Object.assign(row, response.data)
        await refreshSummary()
        toast.add({ title: 'Order items updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to update order items', description: (error as APIError).message, color: 'error' })
    } finally {
        savingOrderItems.value = false
    }
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
