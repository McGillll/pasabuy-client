<template>
    <div class="overflow-hidden rounded-lg border border-dashed border-default bg-elevated/50">
        <div class="border-b border-dashed border-default p-4 text-center">
            <p class="text-xs font-medium uppercase tracking-wide text-muted">Invoice</p>
            <h2 class="mt-1 text-lg font-semibold text-highlighted">
                {{ order.pasabuy_schedule?.title ?? 'Pasabuy order' }}
            </h2>
            <p v-if="order.pasabuy_schedule?.pasabuy_schedule_date" class="mt-0.5 text-sm text-muted">
                Run date: {{ formatDate(order.pasabuy_schedule.pasabuy_schedule_date) }}
            </p>
        </div>

        <div class="flex flex-col gap-1 border-b border-dashed border-default p-4 text-sm">
            <div class="flex items-center justify-between">
                <span class="text-muted">Order ref</span>
                <span class="font-mono text-highlighted">{{ order.uuid.slice(0, 8).toUpperCase() }}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-muted">Placed on</span>
                <span class="text-highlighted">{{ formatDate(order.created_at) }}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-muted">Order status</span>
                <OrderStatusBadge :status="order.status" />
            </div>
            <div class="flex items-center justify-between">
                <span class="text-muted">Payment status</span>
                <PaymentStatusBadge :status="order.payment_status" />
            </div>
        </div>

        <div class="divide-y divide-dashed divide-default">
            <div v-for="item in order.items" :key="item.uuid" class="p-4">
                <OrderLineItem :item="item" />
            </div>
        </div>

        <div class="border-t border-dashed border-default p-4">
            <div class="flex items-center justify-between text-base font-semibold text-highlighted">
                <span>Total</span>
                <span>₱{{ order.total_amount }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Order } from '@/types/Order'

defineProps<{
    order: Order
}>()

function formatDate(value: string) {
    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}
</script>
