<template>
    <div class="space-y-3 rounded-lg border border-default p-3 text-sm">
        <div class="space-y-2">
            <p class="text-xs font-medium uppercase tracking-wide text-muted">Items</p>
            <div v-for="(item, index) in invoice.items" :key="index" class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                    <p class="text-highlighted">{{ item.product_name }}</p>
                    <p class="text-xs text-muted">₱{{ item.unit_price.toFixed(2) }} × {{ item.quantity }}</p>
                </div>
                <span class="shrink-0 font-medium text-highlighted">₱{{ item.line_total.toFixed(2) }}</span>
            </div>
        </div>

        <div class="space-y-1 border-t border-default pt-2">
            <div class="flex items-center justify-between">
                <span class="text-muted">Subtotal</span>
                <span>₱{{ invoice.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-muted">Markup</span>
                <span>₱{{ invoice.markup_amount.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between border-t border-dashed border-default pt-1 font-medium text-highlighted">
                <span>Order total</span>
                <span>₱{{ invoice.total.toFixed(2) }}</span>
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
                    v-for="line in invoice.interest_lines"
                    :key="line.period"
                    class="flex items-center justify-between gap-2 rounded-md bg-elevated/50 px-2 py-1.5"
                >
                    <span class="text-muted">{{ line.label }}</span>
                    <span class="flex shrink-0 items-center gap-2">
                        <span class="text-error">+₱{{ line.interest_amount.toFixed(2) }}</span>
                        <span class="font-medium text-highlighted">₱{{ line.running_total.toFixed(2) }}</span>
                    </span>
                </li>
            </ol>
            <div class="flex items-center justify-between text-error">
                <span>Interest total</span>
                <span>₱{{ invoice.interest_total.toFixed(2) }}</span>
            </div>
        </div>

        <div class="flex items-center justify-between border-t border-default pt-2 text-base font-semibold text-highlighted">
            <span>Grand total</span>
            <span>₱{{ invoice.grand_total.toFixed(2) }}</span>
        </div>

        <div class="space-y-1 border-t border-default pt-2">
            <div class="flex items-center justify-between">
                <span class="text-muted">Amount paid</span>
                <span>₱{{ invoice.amount_paid.toFixed(2) }}</span>
            </div>
            <div class="flex items-center justify-between font-semibold text-highlighted">
                <span>Amount due</span>
                <span>₱{{ invoice.balance_due.toFixed(2) }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Invoice } from '@/types/Invoice'

defineProps<{
    invoice: Invoice
}>()
</script>
