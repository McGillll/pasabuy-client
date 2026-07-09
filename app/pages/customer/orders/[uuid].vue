<template>
    <div class="space-y-6">
        <div v-if="loading" class="text-center text-muted">Loading…</div>

        <UAlert v-else-if="notFound" color="error" variant="subtle" title="Order not found" description="This order doesn't exist or isn't yours." />

        <template v-else-if="order">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <h1 class="text-xl font-semibold text-highlighted">Order summary</h1>
                    <NuxtLink
                        v-if="order.pasabuy_schedule"
                        :to="`/pasabuy/${order.pasabuy_schedule.uuid}`"
                        class="mt-1 block text-sm text-muted hover:text-primary"
                    >
                        {{ order.pasabuy_schedule.title }}
                    </NuxtLink>
                </div>
                <UBadge :color="orderStatusColor[order.status]" variant="subtle">{{ order.status }}</UBadge>
            </div>

            <UAlert
                v-if="justPlaced"
                color="success"
                variant="subtle"
                icon="i-lucide-check"
                title="Order placed!"
                description="The seller will reach out to confirm."
            />

            <UAlert
                v-if="order.status === 'needs_confirmation'"
                color="warning"
                variant="subtle"
                icon="i-lucide-alert-triangle"
                title="Some items need your confirmation"
                description="The seller found a different price in-store. Review the items below."
            />

            <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <div class="divide-y divide-default">
                    <div v-for="item in order.items" :key="item.uuid" class="flex items-center justify-between gap-3 p-4">
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

                <template #footer>
                    <div class="flex items-center justify-between font-medium text-highlighted">
                        <span>Total</span>
                        <span>₱{{ order.total_amount }}</span>
                    </div>
                </template>
            </UCard>

            <div class="flex items-center justify-between gap-3">
                <UButton color="neutral" variant="soft" icon="i-lucide-receipt" to="/customer">
                    All orders
                </UButton>

                <div class="flex items-center gap-2">
                    <UButton
                        v-if="order.is_editable && order.pasabuy_schedule"
                        variant="soft"
                        icon="i-lucide-pencil"
                        :to="`/pasabuy/${order.pasabuy_schedule.uuid}`"
                    >
                        Edit order
                    </UButton>
                    <template v-if="order.is_cancellable && !confirmingCancel">
                        <UButton color="error" variant="ghost" size="sm" @click="confirmingCancel = true">
                            Cancel order
                        </UButton>
                    </template>
                    <template v-else-if="order.is_cancellable">
                        <span class="text-sm text-muted">Are you sure?</span>
                        <UButton color="error" size="sm" :loading="cancelling" @click="cancelOrder">
                            Yes, cancel
                        </UButton>
                        <UButton color="neutral" variant="ghost" size="sm" @click="confirmingCancel = false">
                            No
                        </UButton>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

interface OrderItem {
    uuid: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_bonus: boolean
    confirmation_status: 'none' | 'pending' | 'accepted' | 'removed' | 'out_of_stock'
    quantity: number
    subtotal: string
}

interface Order {
    uuid: string
    status: 'pending' | 'needs_confirmation' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    is_cancellable: boolean
    pasabuy_schedule: { uuid: string; title: string } | null
    items: OrderItem[]
}

const route = useRoute()
const toast = useToast()
const uuid = route.params.uuid as string
const justPlaced = computed(() => route.query.placed === '1')

const order = ref<Order | null>(null)
const loading = ref(true)
const notFound = ref(false)
const confirmingCancel = ref(false)
const cancelling = ref(false)

const orderStatusColor: Record<string, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending: 'neutral',
    needs_confirmation: 'warning',
    confirmed: 'success',
    cancelled: 'error'
}

async function loadOrder() {
    loading.value = true
    try {
        const response = await customerOrderService.fetchMyOrder(uuid)
        order.value = response.data
    } catch (error) {
        if (error instanceof APIError) {
            notFound.value = true
        } else {
            throw error
        }
    } finally {
        loading.value = false
    }
}

async function cancelOrder() {
    if (!order.value) return
    cancelling.value = true
    try {
        const response = await customerOrderService.cancelOrder(order.value.uuid)
        order.value = response.data
        confirmingCancel.value = false
        toast.add({ title: 'Order cancelled', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to cancel', description: (error as APIError).message, color: 'error' })
    } finally {
        cancelling.value = false
    }
}

onMounted(loadOrder)
</script>
