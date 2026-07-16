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
                <span class="font-mono text-highlighted">{{ order.order_no }}</span>
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

        <div class="p-4">
            <div v-if="loading" class="space-y-2">
                <USkeleton class="h-5 w-full" />
                <USkeleton class="h-5 w-full" />
                <USkeleton class="h-5 w-full" />
            </div>

            <UAlert
                v-else-if="error"
                color="error"
                variant="subtle"
                title="Failed to load invoice"
                :description="error"
            >
                <template #actions>
                    <BaseButton size="xs" color="error" variant="soft" @click="loadInvoice">Retry</BaseButton>
                </template>
            </UAlert>

            <InvoiceBreakdown v-else-if="invoice" :invoice="invoice" :order-items="order.items" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'
import type { Invoice } from '@/types/Invoice'
import type { Order } from '@/types/Order'

const props = defineProps<{
    order: Order
}>()

const invoice = ref<Invoice | null>(null)
const loading = ref(false)
const error = ref('')

async function loadInvoice() {
    loading.value = true
    error.value = ''
    try {
        const response = await customerOrderService.fetchInvoice(props.order.uuid)
        invoice.value = response.data
    } catch (err) {
        error.value = (err as APIError).message
    } finally {
        loading.value = false
    }
}

watch(() => props.order.uuid, loadInvoice, { immediate: true })
</script>
