<template>
    <div class="space-y-3 rounded-lg border border-default p-3 text-sm">
        <div v-if="orderItems && orderItems.length > 0" class="flex justify-end">
            <BaseButton size="xs" color="neutral" variant="outline" icon="i-lucide-list" @click="isSummaryOpen = true">
                Order summary
            </BaseButton>
        </div>

        <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-wide text-muted">Billed items</p>
            <div v-for="(item, index) in invoice.items" :key="index" class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                        <p class="text-highlighted">{{ item.product_name }}</p>
                        <UBadge v-if="item.bonus_quantity > 0" color="success" variant="subtle" size="sm" icon="i-lucide-gift">B1T1</UBadge>
                    </div>
                    <p class="text-xs text-muted"><BaseNumber :value="item.unit_price" prefix="₱" class="font-mono tabular-nums" /> × <BaseNumber :value="item.quantity" /></p>
                    <UBadge v-if="item.bonus_quantity > 0" color="success" variant="subtle" size="sm" icon="i-lucide-sparkles" class="mt-1">
                        +<BaseNumber :value="item.bonus_quantity" :maximum-fraction-digits="0" /> free
                    </UBadge>
                </div>
                <BaseNumber :value="item.line_total" prefix="₱" class="shrink-0 font-mono font-medium tabular-nums text-highlighted" />
            </div>
        </div>

        <div class="space-y-1 border-t border-default pt-2">
            <div class="flex items-center justify-between">
                <span class="text-muted">Subtotal</span>
                <BaseNumber :value="invoice.subtotal" prefix="₱" class="font-mono tabular-nums" />
            </div>
            <div class="flex items-center justify-between">
                <span class="text-muted">Markup</span>
                <BaseNumber :value="invoice.markup_amount" prefix="₱" class="font-mono tabular-nums" />
            </div>
            <div v-if="invoice.handling_fee > 0" class="flex items-center justify-between">
                <span class="text-muted">Handling fee</span>
                <BaseNumber :value="invoice.handling_fee" prefix="₱" class="font-mono tabular-nums" />
            </div>
            <div class="flex items-center justify-between border-t border-dashed border-default pt-1 font-medium text-highlighted">
                <span>Order total</span>
                <BaseNumber :value="invoice.total" prefix="₱" class="font-mono tabular-nums" />
            </div>
        </div>

        <div class="flex items-center justify-between border-t border-default pt-2">
            <span class="text-muted">Due date</span>
            <div class="flex items-center gap-2">
                <span>{{ invoice.due_date ? formatDate(invoice.due_date) : 'Not yet set' }}</span>
                <UBadge v-if="invoice.is_overdue" color="error" variant="subtle" size="sm">Overdue</UBadge>
            </div>
        </div>

        <div v-if="invoice.interest_lines.length > 0" class="space-y-1.5 border-t border-default pt-2">
            <div class="flex items-center justify-between">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Overdue interest ledger</p>
                <UBadge color="neutral" variant="subtle" size="sm">
                    {{ invoice.interest_base === 'full_total' ? 'On full total' : 'On outstanding balance' }}
                </UBadge>
            </div>
            <ol class="space-y-1">
                <li
                    v-for="(line, index) in invoice.interest_lines"
                    :key="index"
                    class="flex items-center justify-between gap-2 rounded-md bg-elevated/50 px-2 py-1.5"
                >
                    <span class="text-muted">{{ line.label }}</span>
                    <span class="flex shrink-0 items-center gap-2">
                        <BaseNumber
                            :value="line.amount"
                            :prefix="toNumber(line.amount) >= 0 ? '+₱' : '₱'"
                            :class="line.type === 'payment' ? 'font-mono tabular-nums text-success' : 'font-mono tabular-nums text-error'"
                        />
                        <BaseNumber :value="line.running_total" prefix="₱" class="font-mono font-medium tabular-nums text-highlighted" />
                    </span>
                </li>
            </ol>
            <div class="flex items-center justify-between text-error">
                <span>Interest total</span>
                <BaseNumber :value="invoice.interest_total" prefix="₱" class="font-mono tabular-nums" />
            </div>
        </div>

        <div class="flex items-center justify-between border-t border-default pt-2 text-base font-semibold text-highlighted">
            <span>Grand total</span>
            <BaseNumber :value="invoice.grand_total" prefix="₱" class="font-mono tabular-nums" />
        </div>

        <div class="space-y-1 border-t border-default pt-2">
            <div class="flex items-center justify-between">
                <span class="text-muted">Amount paid</span>
                <BaseNumber :value="invoice.amount_paid" prefix="₱" class="font-mono tabular-nums" />
            </div>
            <div class="flex items-center justify-between font-semibold text-highlighted">
                <span>Amount due</span>
                <BaseNumber :value="invoice.balance_due" prefix="₱" class="font-mono tabular-nums" />
            </div>
        </div>

        <USlideover v-model:open="isSummaryOpen" :side="isDesktop ? 'right' : 'bottom'" title="Order summary">
            <template #body>
                <div class="divide-y divide-default rounded-lg border border-default">
                    <div v-for="item in orderItems" :key="item.uuid" class="p-3">
                        <OrderLineItem :item="item" />
                    </div>
                </div>
            </template>
        </USlideover>
    </div>
</template>

<script setup lang="ts">
import type { Invoice } from '@/types/Invoice'
import type { OrderItem } from '@/types/OrderItem'

defineProps<{
    invoice: Invoice
    orderItems?: OrderItem[]
}>()

const isSummaryOpen = ref(false)
const isDesktop = useIsDesktop()
</script>
