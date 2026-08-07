<template>
    <BaseModal
        v-model:open="workspace.isBuyersModalOpen"
        :title="workspace.selectedSummaryItem ? workspace.selectedSummaryItem.product_name : 'Buyers'"
        view-only
    >
        <div class="space-y-4">
            <BaseTable :data="workspace.buyers" :columns="buyerColumns" :loading="workspace.buyersLoading">
                <template #quantity-cell="{ row }">
                    <BaseNumber :value="row.original.quantity" />
                </template>
                <template #subtotal-cell="{ row }">
                    <BaseNumber :value="row.original.subtotal" prefix="₱" class="font-mono tabular-nums" />
                </template>
                <template #status-cell="{ row }">
                    <OrderStatusBadge :status="row.original.status" />
                </template>
                <template #list-item="{ item: buyer }">
                    <ListCard>
                        <template #title>
                            <p class="font-medium text-highlighted">{{ buyer.customer_name }}</p>
                        </template>
                        <template #meta>
                            <span class="text-muted">Qty <BaseNumber :value="buyer.quantity" /></span>
                            <BaseNumber :value="buyer.subtotal" prefix="₱" class="font-medium text-highlighted font-mono tabular-nums" />
                        </template>
                        <template #status>
                            <OrderStatusBadge :status="buyer.status" />
                        </template>
                    </ListCard>
                </template>
                <template #empty>
                    <BaseEmptyState icon="i-lucide-users" message="No buyers yet." padding="py-6" />
                </template>
            </BaseTable>

            <div v-if="workspace.canConfirmPrice" class="border-t border-default pt-4">
                <div class="mb-2 flex items-center justify-between gap-2">
                    <span class="text-xs font-medium uppercase tracking-wide text-dimmed">In-store price</span>
                    <UBadge v-if="workspace.selectedScheduleProduct?.price_confirmed_at" color="success" variant="subtle" size="sm">
                        Confirmed
                    </UBadge>
                </div>
                <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <BaseFormField label="Actual price">
                            <BaseInput
                                v-model.number="workspace.confirmForm.actual_price"
                                type="number"
                                currency
                                inputmode="decimal"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                :disabled="workspace.confirmForm.product_status === 'out_of_stock'"
                            >
                                <template #leading>
                                    <span class="text-sm text-dimmed">₱</span>
                                </template>
                            </BaseInput>
                        </BaseFormField>
                        <BaseFormField>
                            <template #label>
                                <span class="inline-flex items-center gap-1">
                                    Product status
                                    <BaseHelpTooltip>
                                        This status only applies to this schedule, it does not change the product's catalog listing. B1T1 doubles the quantity charged to buyers as a free bonus. Out of stock zeroes the price for any unconfirmed orders of this product.
                                    </BaseHelpTooltip>
                                </span>
                            </template>
                            <BaseSelect
                                v-model="workspace.confirmForm.product_status"
                                :items="productStatusOptions"
                                value-key="value"
                            />
                        </BaseFormField>
                        <BaseButton size="sm" class="hidden sm:inline-flex" :loading="workspace.confirmForm.saving" @click="workspace.confirmSelectedPrice">
                            Confirm
                        </BaseButton>
                    </div>
                    <BaseButton block class="sm:hidden" :loading="workspace.confirmForm.saving" @click="workspace.confirmSelectedPrice">
                        Confirm
                    </BaseButton>
                </div>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'
import type { ProductBuyer } from '@/types/Schedule'
import type { TableColumn } from '@nuxt/ui'

defineProps<{
    workspace: ScheduleWorkspace
}>()

const buyerColumns: TableColumn<ProductBuyer>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'quantity', header: 'Qty' },
    { accessorKey: 'subtotal', header: 'Subtotal' },
    { id: 'status', header: 'Status' }
]

const productStatusOptions = [
    { label: 'None', value: 'none' },
    { label: 'B1T1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' }
]
</script>
