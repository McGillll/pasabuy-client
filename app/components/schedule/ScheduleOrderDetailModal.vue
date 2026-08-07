<template>
    <BaseModal v-model:open="workspace.isOrderModalOpen" title="Order details" :description="workspace.viewingOrder?.order_no" view-only>
        <div v-if="workspace.viewingOrder" class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-medium text-highlighted">{{ workspace.viewingOrder.customer_name }}</p>
                    <p class="text-sm text-muted">{{ workspace.viewingOrder.customer_contact }}</p>
                </div>
                <div class="flex items-center gap-2">
                    <OrderStatusBadge :status="workspace.viewingOrder.status" />
                </div>
            </div>

            <div class="divide-y divide-default rounded-lg border border-default">
                <div
                    v-for="item in workspace.displayItems"
                    :key="item.uuid"
                    class="flex items-start justify-between gap-3 p-3"
                >
                    <template v-if="workspace.canEditOrderItems && workspace.editingProductUuid === item.product_uuid">
                        <span class="flex-1 truncate font-medium text-highlighted">{{ item.product_name }}</span>
                        <UBadge v-if="workspace.getScheduleProductStatus(item.product_uuid) === 'out_of_stock'" color="error" variant="subtle" size="sm">
                            Out of stock
                        </UBadge>
                        <BaseQuantityInput
                            v-else
                            v-model="workspace.findEditableItem(item.product_uuid)!.quantity"
                            :min="1"
                            size="sm"
                            class="w-24"
                        />
                        <BaseButton
                            icon="i-lucide-x"
                            size="xs"
                            color="error"
                            variant="ghost"
                            aria-label="Remove item"
                            @click="workspace.removeEditableItem(item.product_uuid!); workspace.editingProductUuid = null"
                        />
                        <BaseButton
                            icon="i-lucide-check"
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            aria-label="Done editing"
                            @click="workspace.editingProductUuid = null"
                        />
                    </template>
                    <template v-else>
                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <p class="font-medium text-highlighted">{{ item.product_name }}</p>
                                <UBadge v-if="item.bonus_quantity > 0" color="success" variant="subtle" size="sm" icon="i-lucide-gift">B1T1</UBadge>
                            </div>
                            <p class="mt-0.5 text-sm text-muted"><BaseNumber :value="item.actual_price ?? item.estimated_price" prefix="₱" class="font-mono tabular-nums" /> × <BaseNumber :value="workspace.getLineQuantity(item)" /></p>
                            <p
                                v-if="item.bonus_quantity > 0"
                                class="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                            >
                                <UIcon name="i-lucide-sparkles" class="size-3" />
                                +<BaseNumber :value="item.bonus_quantity" /> free
                            </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-2 pt-0.5">
                            <UBadge v-if="item.is_out_of_stock" color="error" variant="subtle" size="sm">
                                Out of stock
                            </UBadge>
                            <BaseNumber v-else :value="workspace.getLineSubtotal(item)" prefix="₱" class="font-mono font-medium tabular-nums text-highlighted" />
                            <BaseButton
                                v-if="workspace.canEditOrderItems && workspace.findEditableItem(item.product_uuid)"
                                icon="i-lucide-pencil"
                                size="xs"
                                color="neutral"
                                variant="ghost"
                                aria-label="Edit item"
                                @click="workspace.editingProductUuid = item.product_uuid ?? null"
                            />
                        </div>
                    </template>
                </div>
                <div
                    v-for="newItem in workspace.pendingNewItems"
                    :key="newItem.product_uuid"
                    class="flex items-center gap-3 p-3"
                >
                    <span class="flex-1 truncate font-medium text-highlighted">{{ newItem.product_name }}</span>
                    <UBadge color="neutral" variant="subtle" size="sm">New</UBadge>
                    <BaseQuantityInput v-model="newItem.quantity" :min="1" size="sm" class="w-24" />
                    <BaseButton
                        icon="i-lucide-x"
                        size="xs"
                        color="error"
                        variant="ghost"
                        aria-label="Remove item"
                        @click="workspace.removeEditableItem(newItem.product_uuid)"
                    />
                </div>
            </div>

            <div v-if="workspace.canEditOrderItems" class="flex items-center gap-2">
                <BaseSelectMenu
                    v-model="workspace.itemToAdd"
                    :items="workspace.addableProductOptions"
                    :loading="workspace.loadingAllProducts"
                    value-key="value"
                    placeholder="Add a product…"
                    class="flex-1"
                />
                <BaseButton
                    icon="i-lucide-plus"
                    size="sm"
                    color="neutral"
                    variant="soft"
                    :disabled="!workspace.itemToAdd"
                    @click="workspace.addEditableItem"
                >
                    Add
                </BaseButton>
            </div>

            <div class="flex items-center justify-between border-t border-default pt-3 font-medium text-highlighted">
                <span>Total</span>
                <BaseNumber :value="workspace.draftOrderTotal ?? workspace.viewingOrder.total_amount" prefix="₱" class="font-mono tabular-nums" />
            </div>

            <div v-if="workspace.canEditOrderItems" class="flex justify-end gap-2">
                <BaseButton
                    v-if="workspace.hasUnsavedOrderItemChanges"
                    color="neutral"
                    variant="soft"
                    :disabled="workspace.savingOrderItems"
                    @click="workspace.revertOrderItems"
                >
                    Revert changes
                </BaseButton>
                <BaseButton :loading="workspace.savingOrderItems" @click="workspace.saveOrderItems">Save changes</BaseButton>
            </div>

            <p class="text-xs text-dimmed">Placed {{ formatDate(workspace.viewingOrder.created_at) }}</p>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'

defineProps<{
    workspace: ScheduleWorkspace
}>()
</script>
