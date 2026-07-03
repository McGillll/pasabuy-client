<template>
    <div v-if="schedule" class="space-y-8">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">{{ schedule.title }}</h1>
            <div class="mt-2 flex items-center gap-2">
                <UInput :model-value="publicLink" readonly class="w-96" />
                <UButton icon="i-lucide-copy" color="neutral" variant="soft" @click="copyLink">Copy link</UButton>
            </div>
        </div>

        <UCard>
            <template #header>
                <h2 class="font-medium">Details</h2>
            </template>
            <form class="space-y-4" @submit.prevent="saveDetails">
                <UFormField label="Title" required>
                    <UInput v-model="detailsForm.title" class="w-full" />
                </UFormField>
                <UFormField label="Description">
                    <UTextarea v-model="detailsForm.description" class="w-full" />
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
                <UButton type="submit" :loading="savingDetails">Save details</UButton>
            </form>
        </UCard>

        <UCard>
            <template #header>
                <h2 class="font-medium">Products in this schedule</h2>
            </template>
            <div class="space-y-3">
                <div
                    v-for="product in catalog"
                    :key="product.uuid"
                    class="flex items-center gap-4 border-b border-default pb-3 last:border-0"
                >
                    <UCheckbox v-model="selectionFor(product.uuid).selected" />
                    <img
                        v-if="product.image_url"
                        :src="product.image_url"
                        class="size-10 rounded object-cover"
                        alt=""
                    >
                    <div v-else class="size-10 rounded bg-elevated" />
                    <span class="flex-1">{{ product.name }}</span>
                    <UInput
                        v-model.number="selectionFor(product.uuid).price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        class="w-28"
                    />
                    <UInput
                        v-model.number="selectionFor(product.uuid).max_quantity"
                        type="number"
                        min="1"
                        placeholder="Unlimited"
                        class="w-32"
                    />
                </div>
            </div>
            <template #footer>
                <UButton :loading="savingProducts" @click="saveProducts">Save products</UButton>
            </template>
        </UCard>

        <UCard>
            <template #header>
                <h2 class="font-medium">Orders</h2>
            </template>
            <UTable :data="orders" :columns="orderColumns">
                <template #status-cell="{ row }">
                    <UBadge :color="orderStatusColor[row.original.status]" variant="subtle">
                        {{ row.original.status }}
                    </UBadge>
                </template>
                <template #actions-cell="{ row }">
                    <div v-if="row.original.status === 'pending'" class="flex gap-2">
                        <UButton size="xs" color="success" variant="soft" @click="setOrderStatus(row.original, 'confirmed')">
                            Confirm
                        </UButton>
                        <UButton size="xs" color="error" variant="soft" @click="setOrderStatus(row.original, 'cancelled')">
                            Cancel
                        </UButton>
                    </div>
                </template>
            </UTable>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import { productService } from '@/components/api/admin/ProductService'
import APIError from '@/components/api/user/APIError'
import type { TableColumn } from '@nuxt/ui'

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

const detailsForm = reactive({
    title: '',
    description: '',
    status: 'draft' as Schedule['status']
})
const savingDetails = ref(false)

interface SelectionEntry {
    selected: boolean
    price: number | null
    max_quantity: number | null
}

const selection = ref<Record<string, SelectionEntry>>({})
const savingProducts = ref(false)

function selectionFor(uuid: string): SelectionEntry {
    return selection.value[uuid]!
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
        const response = await pasabuyScheduleService.updateSchedule(uuid, { ...detailsForm })
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
