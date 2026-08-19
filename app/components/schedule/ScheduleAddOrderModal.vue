<template>
    <BaseModal
        v-model:open="workspace.isAddOrderModalOpen"
        title="Add order for a customer"
        size="md"
        show-default-footer
        confirm-label="Add order"
        :loading="workspace.savingAddOrder"
        :confirm-disabled="!canSubmit"
        @confirm="workspace.submitAddOrder"
    >
        <div class="space-y-4">
            <p class="text-sm text-muted">
                For customers who won't use the app themselves — enter their order on their behalf.
            </p>

            <BaseFormField label="Customer name" required>
                <BaseInput v-model="workspace.addOrderForm.customer_name" placeholder="e.g. Auntie Rosa, Unit 5B" />
            </BaseFormField>
            <BaseFormField label="Contact number" hint="Optional">
                <BaseInput v-model="workspace.addOrderForm.customer_contact" placeholder="09171234567" />
            </BaseFormField>

            <BaseFormField label="Items">
                <div class="flex items-center gap-2">
                    <BaseSelectMenu
                        v-model="workspace.addOrderItemToAdd"
                        :items="workspace.addOrderProductOptions"
                        :loading="workspace.addOrderSearchLoading"
                        :content="{ side: 'top' }"
                        placeholder="Search products…"
                        class="min-w-0 flex-1"
                        @update:search-term="onSearchTermChange"
                    />
                    <BaseButton
                        icon="i-lucide-plus"
                        :disabled="!workspace.addOrderItemToAdd"
                        aria-label="Add item"
                        @click="workspace.addAddOrderItem"
                    />
                </div>
            </BaseFormField>

            <div v-if="workspace.addOrderItems.length === 0" class="rounded-lg border border-dashed border-default p-4 text-center text-sm text-muted">
                No items added yet.
            </div>

            <div v-else class="divide-y divide-default rounded-lg border border-default">
                <div v-for="item in workspace.addOrderItems" :key="item.product_uuid" class="space-y-2 p-3">
                    <div class="flex items-center justify-between gap-2">
                        <p class="min-w-0 flex-1 truncate font-medium text-highlighted">{{ item.product_name }}</p>
                        <BaseButton
                            icon="i-lucide-trash-2"
                            size="sm"
                            color="error"
                            variant="ghost"
                            :aria-label="`Remove ${item.product_name}`"
                            @click="workspace.removeAddOrderItem(item.product_uuid)"
                        />
                    </div>
                    <div class="flex items-center justify-between gap-2">
                        <BaseQuantityInput v-model="item.quantity" :min="1" size="sm" :aria-label="`Quantity for ${item.product_name}`" />
                        <UBadge v-if="item.isOutOfStock" color="error" variant="subtle" size="sm">Out of stock</UBadge>
                        <BaseNumber
                            v-else
                            :value="item.unitPrice * item.quantity"
                            prefix="₱"
                            class="font-mono text-sm font-medium tabular-nums text-highlighted"
                        />
                    </div>
                </div>
            </div>

            <div v-if="workspace.addOrderItems.length > 0" class="flex items-center justify-between border-t border-default pt-3">
                <p class="text-sm font-medium text-highlighted">Total</p>
                <BaseNumber :value="workspace.addOrderTotal" prefix="₱" class="font-mono text-lg font-semibold tabular-nums text-highlighted" />
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'

const props = defineProps<{
    workspace: ScheduleWorkspace
}>()

const canSubmit = computed(() =>
    props.workspace.addOrderForm.customer_name.trim().length > 0 && props.workspace.addOrderItems.length > 0
)

function onSearchTermChange(term: string) {
    props.workspace.addOrderProductSearch = term
}
</script>
