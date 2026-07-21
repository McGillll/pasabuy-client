<template>
    <div v-if="loading" class="space-y-6">
        <USkeleton class="h-7 w-64" />
        <USkeleton class="h-10 w-full max-w-md" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-64 w-full" />
    </div>

    <UAlert
        v-else-if="!schedule"
        color="neutral"
        variant="subtle"
        icon="i-lucide-search-x"
        title="Schedule not found"
        description="This schedule may have been deleted, or the link is incorrect."
    />

    <div v-else class="min-h-full space-y-6" @touchstart="onTabsTouchStart" @touchmove="onTabsTouchMove" @touchend="onTabsTouchEnd">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">{{ schedule.title }}</h1>
        </div>

        <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #details>
                <div class="overflow-hidden">
                <div ref="panelEl">
                <UCard class="mt-4">
                    <div class="mb-4 flex items-center gap-2">
                        <UInput :model-value="publicLink" readonly class="w-full sm:w-96" />
                        <BaseButton icon="i-lucide-copy" color="neutral" variant="soft" @click="copyLink">Copy link</BaseButton>
                    </div>

                    <UAlert
                        v-if="isClosed"
                        color="neutral"
                        variant="subtle"
                        icon="i-lucide-lock"
                        title="This schedule is closed"
                        description="Reopen it below to edit the title, description, or pasabuy date."
                        class="max-w-lg mb-4"
                    />
                    <UAlert
                        v-if="isFinished"
                        color="success"
                        variant="subtle"
                        icon="i-lucide-check-circle"
                        title="This schedule is finished"
                        description="This batch is fully settled. Details can no longer be edited."
                        class="max-w-lg mb-4"
                    />
                    <form class="max-w-lg space-y-4" @submit.prevent="saveDetails">
                        <UFormField label="Title" required>
                            <UInput v-model="detailsForm.title" placeholder="July grocery run" :disabled="isLocked" class="w-full" />
                        </UFormField>
                        <UFormField label="Description">
                            <UTextarea v-model="detailsForm.description" placeholder="Optional notes for this pasabuy" :disabled="isLocked" class="w-full" />
                        </UFormField>
                        <UFormField label="Pasabuy date" hint="The date you'll go to the store; ordering closes once this date arrives" required>
                            <UInput v-model="detailsForm.pasabuyScheduleDate" type="date" required :disabled="isLocked" class="w-full" />
                        </UFormField>
                        <BaseButton type="submit" :loading="savingDetails" :disabled="isLocked">
                            Save details
                        </BaseButton>
                    </form>

                    <div class="my-6 border-t border-default" />

                    <div class="max-w-lg">
                        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-dimmed">Schedule status</p>
                        <UTabs
                            :model-value="schedule.status"
                            :items="statusTabs"
                            :ui="{ trigger: 'grow' }"
                            @update:model-value="handleStatusTabChange"
                        />
                    </div>
                </UCard>
                </div>
                </div>
            </template>

            <template #summary>
                <div class="overflow-hidden">
                <div ref="panelEl">
                <UTabs v-model="activeSummaryTab" :items="summaryTabs" class="w-full mt-4">
                    <template #pricing>
                        <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
                            <ResponsiveTable
                                :data="summary"
                                :columns="summaryColumns"
                                :ui="{ tr: 'hover:bg-elevated/50 transition-colors cursor-pointer' }"
                                @select="(_event: Event, row: { original: ScheduleSummaryItem }) => openBuyersModal(row.original)"
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
                                    <p class="text-sm text-muted">{{ row.original.category_name ?? '-' }}</p>
                                </template>
                                <template #default_price-cell="{ row }">
                                    ₱{{ row.original.default_price }}
                                </template>
                                <template #total_quantity-cell="{ row }">
                                    {{ getDisplayQuantity(row.original) }}
                                </template>
                                <template #subtotal-cell="{ row }">
                                    <span v-if="getScheduleProductStatus(row.original.product_uuid) === 'out_of_stock'" class="text-sm font-medium text-error">
                                        Out of stock
                                    </span>
                                    <span v-else>₱{{ row.original.subtotal }}</span>
                                </template>
                                <template #list-item="{ item }">
                                    <ListCard
                                        clickable
                                        :chevron="false"
                                        @click="openBuyersModal(item)"
                                    >
                                        <template #title>
                                            <p class="font-medium text-highlighted">{{ item.product_name }}</p>
                                        </template>
                                        <template #subtitle>
                                            {{ item.category_name ?? '-' }}
                                        </template>
                                        <template #meta>
                                            <span class="text-muted">₱{{ item.default_price }} × {{ getDisplayQuantity(item) }}</span>
                                            <span v-if="getScheduleProductStatus(item.product_uuid) === 'out_of_stock'" class="font-medium text-error">
                                                Out of stock
                                            </span>
                                            <span v-else class="font-medium text-highlighted">₱{{ item.subtotal }}</span>
                                        </template>
                                        <template v-if="getScheduleProductStatus(item.product_uuid) === 'b1t1'" #status>
                                            <UBadge color="warning" variant="subtle" size="sm">
                                                B1T1
                                            </UBadge>
                                        </template>
                                    </ListCard>
                                </template>
                                <template #empty>
                                    <TableEmptyState icon="i-lucide-clipboard-list" message="No orders yet. The checklist fills in once customers order." />
                                </template>
                            </ResponsiveTable>
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
                            <template #header>
                                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <h2 class="font-medium">Shopping checklist</h2>
                                    <div class="flex flex-wrap items-center gap-2">
                                        <BaseButton
                                            icon="i-lucide-user-plus"
                                            color="neutral"
                                            variant="soft"
                                            size="sm"
                                            :loading="loadingChecklistShareLink"
                                            :disabled="!isLocked"
                                            @click="copyChecklistShareLink"
                                        >
                                            Share with helper
                                        </BaseButton>
                                        <BaseButton
                                            icon="i-lucide-shield-off"
                                            color="neutral"
                                            variant="ghost"
                                            size="sm"
                                            :loading="regeneratingChecklistShareLink"
                                            :disabled="!isLocked"
                                            aria-label="Revoke helper link"
                                            @click="regenerateChecklistShareLinkAction"
                                        >
                                            <span class="hidden sm:inline">Revoke link</span>
                                        </BaseButton>
                                        <BaseButton
                                            icon="i-lucide-refresh-cw"
                                            color="neutral"
                                            variant="soft"
                                            size="sm"
                                            :loading="regeneratingChecklist"
                                            :disabled="!isLocked"
                                            aria-label="Regenerate checklist"
                                            @click="() => regenerateChecklist()"
                                        >
                                            <span class="hidden sm:inline">Regenerate</span>
                                        </BaseButton>
                                    </div>
                                </div>
                            </template>
                            <ResponsiveTable :data="checklistItems" :columns="checklistColumns" :loading="checklistLoading" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                                <template #is_checked-cell="{ row }">
                                    <UCheckbox
                                        :model-value="row.original.is_checked"
                                        :disabled="togglingUuid === row.original.product_uuid"
                                        @update:model-value="(value) => toggleChecklist(row.original, !!value)"
                                    />
                                </template>
                                <template #product-cell="{ row }">
                                    <p class="font-medium text-highlighted" :class="{ 'line-through text-muted': row.original.is_checked }">{{ row.original.product_name }}</p>
                                    <p class="text-sm text-muted">{{ row.original.category_name ?? '-' }}</p>
                                </template>
                                <template #quantity-cell="{ row }">
                                    <span class="text-lg font-bold tabular-nums" :class="row.original.is_checked ? 'text-muted' : 'text-highlighted'">{{ row.original.quantity }}x</span>
                                </template>
                                <template #adjustment-cell="{ row }">
                                    <UBadge v-if="row.original.additional_quantity > 0" color="warning" variant="subtle" size="sm">
                                        +{{ row.original.additional_quantity }} more
                                    </UBadge>
                                    <UBadge v-if="row.original.return_quantity > 0" color="error" variant="subtle" size="sm">
                                        return {{ row.original.return_quantity }}
                                    </UBadge>
                                </template>
                                <template #list-item="{ item }">
                                    <ListCard>
                                        <template #leading>
                                            <UCheckbox
                                                :model-value="item.is_checked"
                                                :disabled="togglingUuid === item.product_uuid"
                                                @update:model-value="(value) => toggleChecklist(item, !!value)"
                                            />
                                        </template>
                                        <template #title>
                                            <div class="flex w-full items-center justify-between gap-2">
                                                <p class="font-medium text-highlighted" :class="{ 'line-through text-muted': item.is_checked }">{{ item.product_name }}</p>
                                                <p class="shrink-0 text-xl font-bold tabular-nums" :class="item.is_checked ? 'text-muted' : 'text-highlighted'">{{ item.quantity }}x</p>
                                            </div>
                                        </template>
                                        <template #subtitle>
                                            {{ item.category_name ?? '-' }}
                                        </template>
                                        <template v-if="item.additional_quantity > 0 || item.return_quantity > 0" #status>
                                            <UBadge v-if="item.additional_quantity > 0" color="warning" variant="subtle" size="sm">
                                                +{{ item.additional_quantity }} more
                                            </UBadge>
                                            <UBadge v-if="item.return_quantity > 0" color="error" variant="subtle" size="sm">
                                                return {{ item.return_quantity }}
                                            </UBadge>
                                        </template>
                                    </ListCard>
                                </template>
                                <template #empty>
                                    <TableEmptyState icon="i-lucide-list-checks" message="Close the schedule to generate the shopping checklist." />
                                </template>
                            </ResponsiveTable>
                        </UCard>
                    </template>
                </UTabs>
                </div>
                </div>
            </template>

            <template #orders>
                <div class="overflow-hidden">
                <div ref="panelEl">
                <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
                    <ResponsiveTable :data="orders" :columns="orderColumns" :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }">
                        <template #status-cell="{ row }">
                            <OrderStatusBadge :status="row.original.status" />
                        </template>
                        <template #total_amount-cell="{ row }">
                            {{ orderDisplayAmount(row.original) }}
                        </template>
                        <template #actions-cell="{ row }">
                            <div class="flex items-center justify-end gap-2">
                                <template v-if="row.original.status === 'pending'">
                                    <BaseButton
                                        v-if="isClosed"
                                        size="xs"
                                        color="success"
                                        variant="soft"
                                        @click="confirmOrder(row.original)"
                                    >
                                        Confirm
                                    </BaseButton>
                                    <span v-else class="text-xs text-dimmed">Close schedule to confirm</span>
                                    <BaseButton
                                        size="xs"
                                        color="error"
                                        variant="soft"
                                        @click="cancelOrder(row.original)"
                                    >
                                        Cancel
                                    </BaseButton>
                                </template>
                                <BaseButton
                                    icon="i-lucide-eye"
                                    size="xs"
                                    color="neutral"
                                    variant="ghost"
                                    aria-label="View order"
                                    @click="viewOrder(row.original)"
                                />
                            </div>
                        </template>
                        <template #list-item="{ item: order }">
                            <ListCard
                                clickable
                                :chevron="false"
                                :actions="orderActions(order)"
                                @click="viewOrder(order)"
                            >
                                <template #title>
                                    <p class="font-medium text-highlighted">{{ order.customer_name }}</p>
                                </template>
                                <template #subtitle>
                                    {{ order.customer_contact }} · <span class="font-mono text-xs">{{ order.order_no }}</span>
                                </template>
                                <template #meta>
                                    <span class="font-medium text-highlighted">₱{{ orderDisplayAmount(order) }}</span>
                                </template>
                                <template #status>
                                    <OrderStatusBadge :status="order.status" />
                                </template>
                            </ListCard>
                        </template>
                        <template #empty>
                            <TableEmptyState icon="i-lucide-receipt" message="No orders yet." />
                        </template>
                    </ResponsiveTable>
                </UCard>
                </div>
                </div>
            </template>
        </UTabs>

        <BaseModal
            v-model:open="isBuyersModalOpen"
            :title="selectedSummaryItem ? selectedSummaryItem.product_name : 'Buyers'"
            view-only
        >
            <div class="space-y-4">
                <ResponsiveTable :data="buyers" :columns="buyerColumns" :loading="buyersLoading">
                    <template #status-cell="{ row }">
                        <OrderStatusBadge :status="row.original.status" />
                    </template>
                    <template #list-item="{ item: buyer }">
                        <ListCard>
                            <template #title>
                                <p class="font-medium text-highlighted">{{ buyer.customer_name }}</p>
                            </template>
                            <template #meta>
                                <span class="text-muted">Qty {{ buyer.quantity }}</span>
                                <span class="font-medium text-highlighted">₱{{ buyer.subtotal }}</span>
                            </template>
                            <template #status>
                                <OrderStatusBadge :status="buyer.status" />
                            </template>
                        </ListCard>
                    </template>
                    <template #empty>
                        <TableEmptyState icon="i-lucide-users" message="No buyers yet." padding="py-6" />
                    </template>
                </ResponsiveTable>

                <div v-if="canConfirmPrice" class="border-t border-default pt-4">
                    <div class="mb-2 flex items-center justify-between gap-2">
                        <span class="text-xs font-medium uppercase tracking-wide text-dimmed">In-store price</span>
                        <UBadge v-if="selectedScheduleProduct?.price_confirmed_at" color="success" variant="subtle" size="sm">
                            Confirmed
                        </UBadge>
                    </div>
                    <div class="space-y-3">
                        <div class="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                            <UFormField label="Actual price">
                                <UInput
                                    v-model.number="confirmForm.actual_price"
                                    type="number"
                                    inputmode="decimal"
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
                            <BaseButton size="sm" class="hidden sm:inline-flex" :loading="confirmForm.saving" @click="confirmSelectedPrice">
                                Confirm
                            </BaseButton>
                        </div>
                        <BaseButton block class="sm:hidden" :loading="confirmForm.saving" @click="confirmSelectedPrice">
                            Confirm
                        </BaseButton>
                    </div>
                </div>
            </div>
        </BaseModal>

        <BaseModal v-model:open="isOrderModalOpen" title="Order details" :description="viewingOrder?.order_no" view-only>
            <div v-if="viewingOrder" class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-medium text-highlighted">{{ viewingOrder.customer_name }}</p>
                        <p class="text-sm text-muted">{{ viewingOrder.customer_contact }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <OrderStatusBadge :status="viewingOrder.status" />
                    </div>
                </div>

                <div class="divide-y divide-default rounded-lg border border-default">
                    <div
                        v-for="item in displayItems"
                        :key="item.uuid"
                        class="flex items-start justify-between gap-3 p-3"
                    >
                        <template v-if="canEditOrderItems && editingProductUuid === item.product_uuid">
                            <span class="flex-1 truncate font-medium text-highlighted">{{ item.product_name }}</span>
                            <UBadge v-if="getScheduleProductStatus(item.product_uuid) === 'out_of_stock'" color="error" variant="subtle" size="sm">
                                Out of stock
                            </UBadge>
                            <UInput
                                v-else
                                v-model.number="findEditableItem(item.product_uuid)!.quantity"
                                type="number"
                                min="1"
                                size="sm"
                                class="w-20"
                            />
                            <BaseButton
                                icon="i-lucide-x"
                                size="xs"
                                color="error"
                                variant="ghost"
                                aria-label="Remove item"
                                @click="removeEditableItem(item.product_uuid!); editingProductUuid = null"
                            />
                            <BaseButton
                                icon="i-lucide-check"
                                size="xs"
                                color="neutral"
                                variant="ghost"
                                aria-label="Done editing"
                                @click="editingProductUuid = null"
                            />
                        </template>
                        <template v-else>
                            <div class="min-w-0">
                                <div class="flex flex-wrap items-center gap-2">
                                    <p class="font-medium text-highlighted">{{ item.product_name }}</p>
                                    <UBadge v-if="item.bonus_quantity > 0" color="warning" variant="subtle" size="sm" icon="i-lucide-gift">B1T1</UBadge>
                                </div>
                                <p class="mt-0.5 text-sm text-muted">₱{{ item.actual_price ?? item.estimated_price }} × {{ getLineQuantity(item) }}</p>
                                <p
                                    v-if="item.bonus_quantity > 0"
                                    class="mt-1.5 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
                                >
                                    <UIcon name="i-lucide-sparkles" class="size-3" />
                                    +{{ item.bonus_quantity }} free
                                </p>
                            </div>
                            <div class="flex shrink-0 items-center gap-2 pt-0.5">
                                <UBadge v-if="item.is_out_of_stock" color="error" variant="subtle" size="sm">
                                    Out of stock
                                </UBadge>
                                <p v-else class="font-medium text-highlighted">₱{{ getLineSubtotal(item).toFixed(2) }}</p>
                                <BaseButton
                                    v-if="canEditOrderItems && findEditableItem(item.product_uuid)"
                                    icon="i-lucide-pencil"
                                    size="xs"
                                    color="neutral"
                                    variant="ghost"
                                    aria-label="Edit item"
                                    @click="editingProductUuid = item.product_uuid ?? null"
                                />
                            </div>
                        </template>
                    </div>
                    <div
                        v-for="newItem in pendingNewItems"
                        :key="newItem.product_uuid"
                        class="flex items-center gap-3 p-3"
                    >
                        <span class="flex-1 truncate font-medium text-highlighted">{{ newItem.product_name }}</span>
                        <UBadge color="neutral" variant="subtle" size="sm">New</UBadge>
                        <UInput v-model.number="newItem.quantity" type="number" min="1" size="sm" class="w-20" />
                        <BaseButton
                            icon="i-lucide-x"
                            size="xs"
                            color="error"
                            variant="ghost"
                            aria-label="Remove item"
                            @click="removeEditableItem(newItem.product_uuid)"
                        />
                    </div>
                </div>

                <div v-if="canEditOrderItems" class="flex items-center gap-2">
                    <USelect
                        v-model="itemToAdd"
                        :items="addableProductOptions"
                        value-key="value"
                        placeholder="Add a product…"
                        class="flex-1"
                    />
                    <BaseButton
                        icon="i-lucide-plus"
                        size="sm"
                        color="neutral"
                        variant="soft"
                        :disabled="!itemToAdd"
                        @click="addEditableItem"
                    >
                        Add
                    </BaseButton>
                </div>

                <div class="flex items-center justify-between border-t border-default pt-3 font-medium text-highlighted">
                    <span>Total</span>
                    <span>₱{{ draftOrderTotal !== null ? draftOrderTotal.toFixed(2) : viewingOrder.total_amount }}</span>
                </div>

                <div v-if="canEditOrderItems" class="flex justify-end gap-2">
                    <BaseButton
                        v-if="hasUnsavedOrderItemChanges"
                        color="neutral"
                        variant="soft"
                        :disabled="savingOrderItems"
                        @click="revertOrderItems"
                    >
                        Revert changes
                    </BaseButton>
                    <BaseButton :loading="savingOrderItems" @click="saveOrderItems">Save changes</BaseButton>
                </div>

                <p class="text-xs text-dimmed">Placed {{ formatDate(viewingOrder.created_at) }}</p>
            </div>
        </BaseModal>

        <ConfirmDialogModal
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
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { Schedule, ScheduleProduct, ScheduleSummaryItem, ChecklistItem, ProductBuyer } from '@/types/Schedule'
import type { Order } from '@/types/Order'
import type { OrderItem } from '@/types/OrderItem'
import type { DropdownMenuItem, TableColumn, TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const uuid = route.params.uuid as string
const toast = useToast()

const schedule = ref<Schedule | null>(null)
const orders = ref<Order[]>([])
const summary = ref<ScheduleSummaryItem[]>([])
const loading = ref(true)

useHead({ title: computed(() => schedule.value?.title ?? 'Schedule Details') })

const pendingOrderCount = computed(() =>
    orders.value.filter((o) => o.status === 'pending').length
)

const isClosed = computed(() => schedule.value?.status === 'closed')
const isFinished = computed(() => schedule.value?.status === 'finished')
const isLocked = computed(() => isClosed.value || isFinished.value)

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

const { onTouchStart: onTabsTouchStart, onTouchMove: onTabsTouchMove, onTouchEnd: onTabsTouchEnd, panelEl } = useSwipeTabs(
    activeTab,
    computed(() => tabs.value.map((tab) => tab.value as string))
)

const activeSummaryTab = ref('pricing')

const summaryTabs: TabsItem[] = [
    { label: 'Price & Totals', icon: 'i-lucide-receipt-text', value: 'pricing', slot: 'pricing' },
    { label: 'Shopping Checklist', icon: 'i-lucide-list-checks', value: 'checklist', slot: 'checklist' }
]

const statusTabs = computed<TabsItem[]>(() => [
    { label: 'Open', icon: 'i-lucide-unlock', value: 'open', disabled: !canSetStatus('open') },
    { label: 'Closed', icon: 'i-lucide-lock', value: 'closed', disabled: !canSetStatus('closed') },
    { label: 'Finished', icon: 'i-lucide-check-circle', value: 'finished', disabled: !canSetStatus('finished') }
])

function canSetStatus(target: string) {
    const current = schedule.value?.status
    if (current === target) return true
    if (changingStatus.value) return false
    if (current === 'open') return target === 'closed'
    if (current === 'closed') return target === 'open' || target === 'finished'
    return false
}

function handleStatusTabChange(value: string | number) {
    if (value === schedule.value?.status) return
    if (value === 'closed') closeSchedule()
    else if (value === 'open') reopenSchedule()
    else if (value === 'finished') finishSchedule()
}

const detailsForm = reactive({
    title: '',
    description: '',
    pasabuyScheduleDate: ''
})
const savingDetails = ref(false)
const changingStatus = ref(false)

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

function getDisplayQuantity(item: ScheduleSummaryItem) {
    return getScheduleProductStatus(item.product_uuid) === 'b1t1' ? item.total_quantity * 2 : item.total_quantity
}

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
        : Number(scheduleProduct?.product.default_price ?? 0)
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

        const priceSummary = response.data.summary as { auto_applied: number, bonus_applied: number, out_of_stock: number }
        const parts = [`${priceSummary.auto_applied} auto-updated`]
        if (priceSummary.bonus_applied > 0) parts.push(`${priceSummary.bonus_applied} got a B1T1 bonus`)
        if (priceSummary.out_of_stock > 0) parts.push(`${priceSummary.out_of_stock} out of stock`)

        toast.add({ title: 'Price confirmed', description: parts.join(', '), color: 'success' })
        await Promise.all([refreshOrders(), refreshSummary()])
        syncViewingOrder()
    } catch (error) {
        toast.add({ title: 'Confirm failed', description: (error as APIError).message, color: 'error' })
    } finally {
        confirmForm.saving = false
    }
}

// ---- Shopping checklist ----

const checklistItems = ref<ChecklistItem[]>([])
const checklistLoading = ref(false)
const regeneratingChecklist = ref(false)
const togglingUuid = ref<string | null>(null)
const loadingChecklistShareLink = ref(false)
const regeneratingChecklistShareLink = ref(false)

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

async function regenerateChecklist(silent = false) {
    if (!silent) regeneratingChecklist.value = true
    try {
        const response = await pasabuyScheduleService.regenerateChecklist(uuid)
        checklistItems.value = response.data
        if (!silent) toast.add({ title: 'Checklist regenerated', color: 'success' })
    } catch (error) {
        if (!silent) toast.add({ title: 'Failed to regenerate checklist', description: (error as APIError).message, color: 'error' })
    } finally {
        if (!silent) regeneratingChecklist.value = false
    }
}

const { copyTextAsync } = useAsyncClipboard()

async function copyChecklistShareLink() {
    loadingChecklistShareLink.value = true
    try {
        let token = ''
        await copyTextAsync(async () => {
            const response = await pasabuyScheduleService.fetchChecklistShareLink(uuid)
            token = response.data.token
            return `${window.location.origin}/pasabuy/checklist/${token}`
        })
        toast.add({ title: 'Helper link copied', description: 'Anyone with this link can view and check off items, no account needed.', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to get share link', description: (error as APIError).message, color: 'error' })
    } finally {
        loadingChecklistShareLink.value = false
    }
}

function regenerateChecklistShareLinkAction() {
    askConfirm({
        title: 'Regenerate helper link?',
        description: 'This invalidates the current helper link. Anyone still using it will lose access.',
        confirmLabel: 'Regenerate link',
        color: 'error',
        action: async () => {
            regeneratingChecklistShareLink.value = true
            try {
                let token = ''
                await copyTextAsync(async () => {
                    const response = await pasabuyScheduleService.regenerateChecklistShareLink(uuid)
                    token = response.data.token
                    return `${window.location.origin}/pasabuy/checklist/${token}`
                })
                toast.add({ title: 'New helper link copied', description: 'The previous link no longer works.', color: 'success' })
                if (checklistChannel) subscribeChecklistChannel(token)
            } catch (error) {
                toast.add({ title: 'Failed to revoke link', description: (error as APIError).message, color: 'error' })
            } finally {
                regeneratingChecklistShareLink.value = false
            }
        }
    })
}

const { $echo } = useNuxtApp()
const checklistShareToken = ref<string | null>(null)
let checklistChannel: ReturnType<typeof $echo.channel> | null = null

function applyBroadcastChecklistUpdate(updatedItem: ChecklistItem) {
    const item = checklistItems.value.find((candidate) => candidate.product_uuid === updatedItem.product_uuid)
    if (item) Object.assign(item, updatedItem)
}

function applyBroadcastChecklistRegenerated(payload: { items: ChecklistItem[] }) {
    checklistItems.value = payload.items
}

function subscribeChecklistChannel(token: string) {
    if (checklistShareToken.value) $echo.leaveChannel(`checklist.${checklistShareToken.value}`)
    checklistShareToken.value = token
    checklistChannel = $echo.channel(`checklist.${token}`)
    checklistChannel.listen('.checklist.item.toggled', applyBroadcastChecklistUpdate)
    checklistChannel.listen('.checklist.regenerated', applyBroadcastChecklistRegenerated)
}

function stopChecklistLiveSync() {
    if (checklistShareToken.value) $echo.leaveChannel(`checklist.${checklistShareToken.value}`)
    checklistChannel = null
    checklistShareToken.value = null
}

async function startChecklistLiveSync() {
    if (checklistChannel) return
    try {
        const response = await pasabuyScheduleService.fetchChecklistShareLink(uuid)
        subscribeChecklistChannel(response.data.token)
    } catch {
        // Share link isn't ready yet (schedule not closed); admin can still toggle items manually.
    }
}

watch(
    [activeTab, activeSummaryTab, isLocked],
    ([tab, summaryTab, locked]) => {
        if (tab === 'summary' && summaryTab === 'checklist' && locked) {
            startChecklistLiveSync()
        } else {
            stopChecklistLiveSync()
        }
    },
    { immediate: true }
)

onUnmounted(stopChecklistLiveSync)

async function toggleChecklist(item: ChecklistItem, isChecked: boolean) {
    const previousIsChecked = item.is_checked
    const previousCheckedAt = item.checked_at

    item.is_checked = isChecked
    togglingUuid.value = item.product_uuid
    try {
        const response = await pasabuyScheduleService.toggleChecklistItem(uuid, item.product_uuid, isChecked)
        Object.assign(item, response.data)
    } catch (error) {
        item.is_checked = previousIsChecked
        item.checked_at = previousCheckedAt
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
        detailsForm.pasabuyScheduleDate = schedule.value!.pasabuy_schedule_date ?? ''

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

async function pullRefresh() {
    try {
        const [scheduleResponse, ordersResponse, summaryResponse] = await Promise.all([
            pasabuyScheduleService.fetchSchedule(uuid),
            pasabuyScheduleService.fetchOrders(uuid),
            pasabuyScheduleService.fetchScheduleSummary(uuid)
        ])
        schedule.value = scheduleResponse.data
        orders.value = ordersResponse.data
        summary.value = summaryResponse.data
        await loadChecklist()
    } catch (error) {
        toast.add({ title: 'Failed to refresh', description: (error as APIError).message, color: 'error' })
    }
}

async function saveDetails() {
    if (!detailsForm.pasabuyScheduleDate) {
        toast.add({ title: 'Pasabuy date is required', color: 'error' })
        return
    }

    savingDetails.value = true
    try {
        const response = await pasabuyScheduleService.updateSchedule(uuid, {
            title: detailsForm.title,
            description: detailsForm.description,
            pasabuy_schedule_date: detailsForm.pasabuyScheduleDate
        })
        schedule.value = { ...schedule.value!, ...response.data }
        toast.add({ title: 'Schedule updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingDetails.value = false
    }
}

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

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
    await copyTextAsync(async () => publicLink.value)
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

function confirmOrder(order: Order) {
    askConfirm({
        title: 'Confirm order?',
        description: `Confirm ${order.customer_name}'s order? This marks it as settled.`,
        confirmLabel: 'Confirm order',
        color: 'success',
        action: () => setOrderStatus(order, 'confirmed')
    })
}

function cancelOrder(order: Order) {
    askConfirm({
        title: 'Cancel order?',
        description: `Cancel ${order.customer_name}'s order? This cannot be undone.`,
        confirmLabel: 'Cancel order',
        color: 'error',
        action: () => setOrderStatus(order, 'cancelled')
    })
}

function orderActions(order: Order): DropdownMenuItem[] {
    if (order.status !== 'pending') return []
    return [
        ...(isClosed.value ? [{ label: 'Confirm order', icon: 'i-lucide-check', color: 'success' as const, onSelect: () => confirmOrder(order) }] : []),
        { label: 'Cancel order', icon: 'i-lucide-x', color: 'error', onSelect: () => cancelOrder(order) }
    ]
}

const isOrderModalOpen = ref(false)
const viewingOrder = ref<Order | null>(null)
const canEditOrderItems = computed(() => isClosed.value)
const editingProductUuid = ref<string | null>(null)

interface EditableItem {
    product_uuid: string
    product_name: string
    quantity: number
}

const editableItems = ref<EditableItem[]>([])
const originalEditableItems = ref<EditableItem[]>([])
const itemToAdd = ref<string | undefined>(undefined)
const savingOrderItems = ref(false)

const hasUnsavedOrderItemChanges = computed(() =>
    JSON.stringify(editableItems.value) !== JSON.stringify(originalEditableItems.value)
)

function buildEditableItems(order: Order): EditableItem[] {
    return order.items
        .filter((item) => item.product_uuid)
        .map((item) => ({ product_uuid: item.product_uuid!, product_name: item.product_name, quantity: item.quantity }))
}

// Existing order items still shown via viewingOrder.items; ones removed from editableItems drop out here.
const displayItems = computed(() => {
    const items = viewingOrder.value?.items ?? []
    if (!canEditOrderItems.value) return items
    const editableUuids = new Set(editableItems.value.map((item) => item.product_uuid))
    return items.filter((item) => !item.product_uuid || editableUuids.has(item.product_uuid))
})

// Items added via "Add a product" that aren't part of the saved order yet, shown as pending rows until saved.
const pendingNewItems = computed(() => {
    if (!canEditOrderItems.value) return []
    const existingUuids = new Set((viewingOrder.value?.items ?? []).map((item) => item.product_uuid))
    return editableItems.value.filter((item) => !existingUuids.has(item.product_uuid))
})

function findEditableItem(productUuid?: string) {
    return editableItems.value.find((item) => item.product_uuid === productUuid)
}

function getScheduleProductStatus(productUuid: string) {
    return schedule.value?.products.find((sp) => sp.product.uuid === productUuid)?.product_status
}

function getScheduleProductPrice(productUuid: string) {
    const sp = schedule.value?.products.find((p) => p.product.uuid === productUuid)
    if (!sp) return 0
    return sp.actual_price !== null && sp.actual_price !== undefined ? Number(sp.actual_price) : Number(sp.product.default_price)
}

// Live preview of the order total while editing, since viewingOrder.total_amount only updates after Save.
const draftOrderTotal = computed(() => {
    if (!canEditOrderItems.value) return null
    return editableItems.value.reduce((sum, item) => {
        if (getScheduleProductStatus(item.product_uuid) === 'out_of_stock') return sum
        return sum + getScheduleProductPrice(item.product_uuid) * item.quantity
    }, 0)
})

// Per-line quantity/subtotal preview while editing; displayItems still holds the server-saved values.
function getLineQuantity(item: OrderItem) {
    if (!canEditOrderItems.value || !item.product_uuid) return item.quantity
    return findEditableItem(item.product_uuid)?.quantity ?? item.quantity
}

function getLineSubtotal(item: OrderItem) {
    if (!canEditOrderItems.value || !item.product_uuid) return Number(item.subtotal)
    if (getScheduleProductStatus(item.product_uuid) === 'out_of_stock') return 0
    return getScheduleProductPrice(item.product_uuid) * getLineQuantity(item)
}

const addableProductOptions = computed(() => {
    const usedUuids = new Set(editableItems.value.map((item) => item.product_uuid))
    return (schedule.value?.products ?? [])
        .filter((sp) => !usedUuids.has(sp.product.uuid))
        .map((sp) => ({ label: sp.product.name, value: sp.product.uuid }))
})

function syncViewingOrder() {
    if (!viewingOrder.value) return
    const updated = orders.value.find((o) => o.uuid === viewingOrder.value!.uuid)
    if (!updated) return

    viewingOrder.value = updated
    editableItems.value = buildEditableItems(updated)
    originalEditableItems.value = buildEditableItems(updated)
}

function viewOrder(order: Order) {
    viewingOrder.value = order
    editableItems.value = buildEditableItems(order)
    originalEditableItems.value = buildEditableItems(order)
    itemToAdd.value = undefined
    editingProductUuid.value = null
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

function revertOrderItems() {
    editableItems.value = originalEditableItems.value.map((item) => ({ ...item }))
    editingProductUuid.value = null
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
        editableItems.value = buildEditableItems(response.data)
        originalEditableItems.value = buildEditableItems(response.data)
        editingProductUuid.value = null
        await refreshSummary()
        toast.add({ title: 'Order items updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to update order items', description: (error as APIError).message, color: 'error' })
    } finally {
        savingOrderItems.value = false
    }
}

function orderDisplayAmount(order: Order) {
    return isFinished.value ? order.amount_due : order.total_amount
}

const orderColumns: TableColumn<Order>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'customer_contact', header: 'Contact' },
    { accessorKey: 'order_no', header: 'Order no' },
    { accessorKey: 'total_amount', header: 'Total' },
    { accessorKey: 'status', header: 'Status' },
    { id: 'actions', header: '' }
]

onMounted(loadAll)
onPullToRefresh(pullRefresh)
</script>
