<template>
    <div v-if="schedule" class="space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">{{ schedule.title }}</h1>
            <div class="mt-2 flex items-center gap-2">
                <UInput :model-value="publicLink" readonly class="w-full sm:w-96" />
                <UButton icon="i-lucide-copy" color="neutral" variant="soft" @click="copyLink">Copy link</UButton>
            </div>
        </div>

        <UTabs v-model="activeTab" :items="tabs" class="w-full">
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
                        <UButton
                            v-if="schedule.status === 'closed'"
                            size="sm"
                            color="success"
                            variant="soft"
                            :loading="changingStatus"
                            @click="finishSchedule"
                        >
                            Mark finished
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
                    <UAlert
                        v-if="isFinished"
                        color="success"
                        variant="subtle"
                        icon="i-lucide-check-circle"
                        title="This schedule is finished"
                        description="This batch is fully settled — details can no longer be edited."
                        class="max-w-lg mb-4"
                    />
                    <form class="max-w-lg space-y-4" @submit.prevent="saveDetails">
                        <UFormField label="Title" required>
                            <UInput v-model="detailsForm.title" :disabled="isLocked" class="w-full" />
                        </UFormField>
                        <UFormField label="Description">
                            <UTextarea v-model="detailsForm.description" :disabled="isLocked" class="w-full" />
                        </UFormField>
                        <UFormField label="Cutoff (optional)">
                            <UInput v-model="detailsForm.cutoffAt" type="datetime-local" :disabled="isLocked" class="w-full" />
                        </UFormField>
                        <UButton type="submit" :loading="savingDetails" :disabled="isLocked">
                            Save details
                        </UButton>
                    </form>
                </UCard>
            </template>

            <template #summary>
                <UTabs v-model="activeSummaryTab" :items="summaryTabs" class="w-full mt-4">
                    <template #pricing>
                        <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
                            <UTable
                                :data="summary"
                                :columns="summaryColumns"
                                :ui="{ tr: 'hover:bg-elevated/50 transition-colors cursor-pointer' }"
                                @select="(_event, row) => openBuyersModal(row.original)"
                            >
                                <template #product_name-cell="{ row }">
                                    <div class="flex items-center gap-2">
                                        <p class="font-medium text-highlighted">{{ row.original.product_name }}</p>
                                        <UBadge v-if="getScheduleProductStatus(row.original.product_uuid) === 'b1t1'" color="warning" variant="subtle" size="sm">
                                            B1T1
                                        </UBadge>
                                        <UBadge v-else-if="getScheduleProductStatus(row.original.product_uuid) === 'out_of_stock'" color="error" variant="subtle" size="sm">
                                            Out of stock
                                        </UBadge>
                                    </div>
                                    <p class="text-sm text-muted">{{ row.original.category_name ?? '—' }}</p>
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

                    <template #checklist>
                        <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
                            <UTable :data="checklistItems" :columns="checklistColumns" :loading="checklistLoading" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                                <template #is_checked-cell="{ row }">
                                    <UCheckbox
                                        :model-value="row.original.is_checked"
                                        :disabled="togglingUuid === row.original.product_uuid"
                                        @update:model-value="(value) => toggleChecklist(row.original, !!value)"
                                    />
                                </template>
                                <template #product-cell="{ row }">
                                    <p class="font-medium text-highlighted" :class="{ 'line-through text-muted': row.original.is_checked }">{{ row.original.product_name }}</p>
                                    <p class="text-sm text-muted">{{ row.original.category_name ?? '—' }}</p>
                                </template>
                                <template #adjustment-cell="{ row }">
                                    <UBadge v-if="row.original.additional_quantity > 0" color="warning" variant="subtle" size="sm">
                                        +{{ row.original.additional_quantity }} more
                                    </UBadge>
                                    <UBadge v-if="row.original.return_quantity > 0" color="error" variant="subtle" size="sm">
                                        return {{ row.original.return_quantity }}
                                    </UBadge>
                                </template>
                                <template #empty>
                                    <div class="flex flex-col items-center gap-3 py-10">
                                        <UIcon name="i-lucide-list-checks" class="size-8 text-dimmed" />
                                        <p class="text-sm text-muted">
                                            Close the schedule to generate the shopping checklist.
                                        </p>
                                    </div>
                                </template>
                            </UTable>
                        </UCard>
                    </template>
                </UTabs>
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

        <UModal
            v-model:open="isBuyersModalOpen"
            :title="selectedSummaryItem ? selectedSummaryItem.product_name : 'Buyers'"
        >
            <template #body>
                <div class="space-y-4">
                    <UTable :data="buyers" :columns="buyerColumns" :loading="buyersLoading">
                        <template #status-cell="{ row }">
                            <UBadge :color="orderStatusColor[row.original.status]" variant="subtle">
                                {{ row.original.status }}
                            </UBadge>
                        </template>
                        <template #empty>
                            <div class="flex flex-col items-center gap-3 py-6">
                                <UIcon name="i-lucide-users" class="size-8 text-dimmed" />
                                <p class="text-sm text-muted">No buyers yet.</p>
                            </div>
                        </template>
                    </UTable>

                    <div v-if="canConfirmPrice" class="border-t border-default pt-4">
                        <div class="mb-2 flex items-center justify-between gap-2">
                            <span class="text-xs font-medium uppercase tracking-wide text-dimmed">In-store price</span>
                            <UBadge v-if="selectedScheduleProduct?.price_confirmed_at" color="success" variant="subtle" size="sm">
                                Confirmed
                            </UBadge>
                        </div>
                        <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                            <UFormField label="Actual price">
                                <UInput
                                    v-model.number="confirmForm.actual_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    :disabled="confirmForm.product_status === 'out_of_stock'"
                                    class="w-full"
                                >
                                    <template #leading>
                                        <span class="text-sm text-dimmed">₱</span>
                                    </template>
                                </UInput>
                            </UFormField>
                            <UFormField label="Product status">
                                <USelect
                                    v-model="confirmForm.product_status"
                                    :items="productStatusOptions"
                                    value-key="value"
                                    class="w-full"
                                />
                            </UFormField>
                            <UButton size="sm" :loading="confirmForm.saving" @click="confirmSelectedPrice">
                                Confirm
                            </UButton>
                        </div>
                    </div>
                </div>
            </template>
        </UModal>

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
                                <UBadge v-if="getScheduleProductStatus(editItem.product_uuid) === 'out_of_stock'" color="error" variant="subtle" size="sm">
                                    Out of stock
                                </UBadge>
                                <UInput v-else v-model.number="editItem.quantity" type="number" min="1" size="sm" class="w-20" />
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
                                    <UBadge v-else-if="item.confirmation_status === 'out_of_stock'" color="error" variant="subtle" size="sm">
                                        Out of stock
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

        <UModal v-model:open="confirmDialog.open" :title="confirmDialog.title">
            <template #body>
                <p class="text-sm text-muted">{{ confirmDialog.description }}</p>
                <div class="mt-4 flex justify-end gap-2">
                    <UButton color="neutral" variant="soft" @click="confirmDialog.open = false">
                        Cancel
                    </UButton>
                    <UButton :color="confirmDialog.color" :loading="changingStatus" @click="confirmDialogAccept">
                        {{ confirmDialog.confirmLabel }}
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { Schedule, ScheduleProduct, ScheduleSummaryItem, ChecklistItem, ProductBuyer } from '@/types/Schedule'
import type { Order } from '@/types/Order'
import type { TableColumn, TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const uuid = route.params.uuid as string
const toast = useToast()

const schedule = ref<Schedule | null>(null)
const orders = ref<Order[]>([])
const summary = ref<ScheduleSummaryItem[]>([])
const loading = ref(true)

const pendingOrderCount = computed(() =>
    orders.value.filter((o) => o.status === 'pending' || o.status === 'needs_confirmation').length
)
const isClosed = computed(() => schedule.value?.status === 'closed')
const isFinished = computed(() => schedule.value?.status === 'finished')
const isLocked = computed(() => isClosed.value || isFinished.value)

const scheduleStatusColor: Record<Schedule['status'], 'neutral' | 'success' | 'warning'> = {
    open: 'success',
    closed: 'warning',
    finished: 'neutral'
}

const activeTab = ref('summary')

const tabs = computed<TabsItem[]>(() => [
    { label: 'Details', icon: 'i-lucide-file-text', value: 'details', slot: 'details' },
    { label: 'Summary', icon: 'i-lucide-clipboard-list', value: 'summary', slot: 'summary' },
    {
        label: 'Orders',
        icon: 'i-lucide-receipt',
        value: 'orders',
        slot: 'orders',
        badge: pendingOrderCount.value > 0 ? pendingOrderCount.value : undefined
    }
])

const activeSummaryTab = ref('pricing')

const summaryTabs: TabsItem[] = [
    { label: 'Price & Totals', icon: 'i-lucide-receipt-text', value: 'pricing', slot: 'pricing' },
    { label: 'Shopping Checklist', icon: 'i-lucide-list-checks', value: 'checklist', slot: 'checklist' }
]

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

const productStatusOptions = [
    { label: 'None', value: 'none' },
    { label: 'B1T1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' }
]
const canConfirmPrice = computed(() => schedule.value?.status !== 'finished')

const publicLink = computed(() => {
    if (!import.meta.client) return ''
    return `${window.location.origin}/pasabuy/${uuid}`
})

const summaryColumns: TableColumn<ScheduleSummaryItem>[] = [
    { accessorKey: 'product_name', header: 'Product' },
    { id: 'default_price', header: 'Price' },
    { accessorKey: 'total_quantity', header: 'Total qty' },
    { id: 'subtotal', header: 'Subtotal' }
]

const summaryGrandTotal = computed(() => summary.value.reduce((sum, item) => sum + Number(item.subtotal), 0))

// ---- Buyers modal / price confirmation ----

const isBuyersModalOpen = ref(false)
const buyersLoading = ref(false)
const buyers = ref<ProductBuyer[]>([])
const selectedSummaryItem = ref<ScheduleSummaryItem | null>(null)
const selectedScheduleProduct = computed(() =>
    schedule.value?.products.find((sp) => sp.product.uuid === selectedSummaryItem.value?.product_uuid) ?? null
)

const buyerColumns: TableColumn<ProductBuyer>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'quantity', header: 'Qty' },
    { accessorKey: 'subtotal', header: 'Subtotal' },
    { id: 'status', header: 'Status' }
]

const confirmForm = reactive({
    actual_price: null as number | null,
    product_status: 'none' as 'none' | 'b1t1' | 'out_of_stock',
    saving: false
})

async function openBuyersModal(item: ScheduleSummaryItem) {
    selectedSummaryItem.value = item
    isBuyersModalOpen.value = true

    const scheduleProduct = schedule.value?.products.find((sp) => sp.product.uuid === item.product_uuid)
    confirmForm.actual_price = scheduleProduct?.actual_price !== null && scheduleProduct?.actual_price !== undefined
        ? Number(scheduleProduct.actual_price)
        : null
    confirmForm.product_status = scheduleProduct?.product_status ?? 'none'

    buyersLoading.value = true
    try {
        const response = await pasabuyScheduleService.fetchProductBuyers(uuid, item.product_uuid)
        buyers.value = response.data
    } catch (error) {
        toast.add({ title: 'Failed to load buyers', description: (error as APIError).message, color: 'error' })
    } finally {
        buyersLoading.value = false
    }
}

async function confirmSelectedPrice() {
    const scheduleProduct = selectedScheduleProduct.value
    if (!scheduleProduct) return

    confirmForm.saving = true
    try {
        const response = await pasabuyScheduleService.confirmProductPrice(uuid, scheduleProduct.uuid, {
            actual_price: confirmForm.product_status === 'out_of_stock' ? undefined : (confirmForm.actual_price ?? undefined),
            product_status: confirmForm.product_status
        })

        const updated = response.data.schedule_product as ScheduleProduct
        const sp = schedule.value?.products.find((p) => p.uuid === scheduleProduct.uuid)
        if (sp) Object.assign(sp, updated)

        const priceSummary = response.data.summary as { auto_applied: number, needs_confirmation: number, bonus_applied: number }
        const parts = [`${priceSummary.auto_applied} auto-updated`, `${priceSummary.needs_confirmation} need customer confirmation`]
        if (priceSummary.bonus_applied > 0) parts.push(`${priceSummary.bonus_applied} got a B1T1 bonus`)

        toast.add({ title: 'Price confirmed', description: parts.join(', '), color: 'success' })
        await Promise.all([refreshOrders(), refreshSummary()])
    } catch (error) {
        toast.add({ title: 'Confirm failed', description: (error as APIError).message, color: 'error' })
    } finally {
        confirmForm.saving = false
    }
}

// ---- Shopping checklist ----

const checklistItems = ref<ChecklistItem[]>([])
const checklistLoading = ref(false)
const togglingUuid = ref<string | null>(null)

const checklistColumns: TableColumn<ChecklistItem>[] = [
    { id: 'is_checked', header: '' },
    { id: 'product', header: 'Product' },
    { accessorKey: 'quantity', header: 'Qty' },
    { id: 'adjustment', header: '' }
]

async function loadChecklist() {
    checklistLoading.value = true
    try {
        const response = await pasabuyScheduleService.fetchChecklist(uuid)
        checklistItems.value = response.data
    } catch (error) {
        toast.add({ title: 'Failed to load checklist', description: (error as APIError).message, color: 'error' })
    } finally {
        checklistLoading.value = false
    }
}

async function toggleChecklist(item: ChecklistItem, isChecked: boolean) {
    togglingUuid.value = item.product_uuid
    try {
        const response = await pasabuyScheduleService.toggleChecklistItem(uuid, item.product_uuid, isChecked)
        Object.assign(item, response.data)
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        togglingUuid.value = null
    }
}

async function loadAll() {
    loading.value = true
    try {
        const [scheduleResponse, ordersResponse, summaryResponse] = await Promise.all([
            pasabuyScheduleService.fetchSchedule(uuid),
            pasabuyScheduleService.fetchOrders(uuid),
            pasabuyScheduleService.fetchScheduleSummary(uuid)
        ])

        schedule.value = scheduleResponse.data
        orders.value = ordersResponse.data
        summary.value = summaryResponse.data

        detailsForm.title = schedule.value!.title
        detailsForm.description = schedule.value!.description ?? ''
        detailsForm.cutoffAt = isoToDatetimeLocal(schedule.value!.cutoff_at)

        await loadChecklist()
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

const confirmDialog = reactive({
    open: false,
    title: '',
    description: '',
    color: 'primary' as 'primary' | 'success' | 'error',
    confirmLabel: 'Confirm',
    action: null as (() => Promise<void>) | null
})

function askConfirm(options: { title: string, description: string, color?: 'primary' | 'success' | 'error', confirmLabel?: string, action: () => Promise<void> }) {
    confirmDialog.title = options.title
    confirmDialog.description = options.description
    confirmDialog.color = options.color ?? 'primary'
    confirmDialog.confirmLabel = options.confirmLabel ?? 'Confirm'
    confirmDialog.action = options.action
    confirmDialog.open = true
}

async function confirmDialogAccept() {
    const action = confirmDialog.action
    if (!action) return
    await action()
    confirmDialog.open = false
}

function closeSchedule() {
    askConfirm({
        title: 'Close schedule?',
        description: 'Customers will no longer be able to order or edit their orders.',
        confirmLabel: 'Close schedule',
        action: async () => {
            changingStatus.value = true
            try {
                const response = await pasabuyScheduleService.closeSchedule(uuid)
                schedule.value = { ...schedule.value!, ...response.data }
                toast.add({ title: 'Schedule closed', color: 'success' })
                await loadChecklist()
            } catch (error) {
                toast.add({ title: 'Failed to close schedule', description: (error as APIError).message, color: 'error' })
            } finally {
                changingStatus.value = false
            }
        }
    })
}

function reopenSchedule() {
    askConfirm({
        title: 'Reopen schedule?',
        description: 'Customers will be able to order and edit their orders again.',
        confirmLabel: 'Reopen schedule',
        action: async () => {
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
    })
}

function finishSchedule() {
    askConfirm({
        title: 'Mark schedule as finished?',
        description: 'This cannot be undone.',
        color: 'success',
        confirmLabel: 'Mark finished',
        action: async () => {
            changingStatus.value = true
            try {
                const response = await pasabuyScheduleService.finishSchedule(uuid)
                schedule.value = { ...schedule.value!, ...response.data }
                toast.add({ title: 'Schedule finished', color: 'success' })
            } catch (error) {
                toast.add({ title: 'Failed to finish schedule', description: (error as APIError).message, color: 'error' })
            } finally {
                changingStatus.value = false
            }
        }
    })
}

async function refreshOrders() {
    const response = await pasabuyScheduleService.fetchOrders(uuid)
    orders.value = response.data
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

function getScheduleProductStatus(productUuid: string) {
    return schedule.value?.products.find((sp) => sp.product.uuid === productUuid)?.product_status
}

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
