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
                            <div v-for="{ product, entry } in selectedProducts" :key="product.uuid" class="p-3">
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
                                    <UFormField label="Price">
                                        <UInput
                                            v-model.number="entry.price"
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
                            <div v-if="row.original.status === 'pending'" class="flex items-center gap-2">
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
                                <UButton size="xs" color="error" variant="soft" @click="setOrderStatus(row.original, 'cancelled')">
                                    Cancel
                                </UButton>
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
    price: string
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
    product_price: string
    quantity: number
    subtotal: string
}

interface Order {
    uuid: string
    customer_name: string
    customer_contact: string
    status: 'pending' | 'confirmed' | 'cancelled'
    total_amount: string
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

const pendingOrderCount = computed(() => orders.value.filter((o) => o.status === 'pending').length)
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
    price: number | null
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
        return entry?.selected ? [{ product, entry }] : []
    })
)

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
                price: attached ? Number(attached.price) : null,
                max_quantity: attached ? attached.max_quantity : null
            }
        }
        selection.value = initialSelection
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
                price: entry.price ?? 0,
                max_quantity: entry.max_quantity
            }))

        const response = await pasabuyScheduleService.syncProducts(uuid, products)
        schedule.value = response.data
        toast.add({ title: 'Products updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingProducts.value = false
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

const orderColumns: TableColumn<Order>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'customer_contact', header: 'Contact' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { id: 'actions', header: '' }
]

const orderStatusColor: Record<string, 'neutral' | 'success' | 'error'> = {
    pending: 'neutral',
    confirmed: 'success',
    cancelled: 'error'
}

onMounted(loadAll)
</script>
