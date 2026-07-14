<template>
    <div class="mx-auto max-w-2xl space-y-6">
        <Transition
            enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
        >
            <SplashScreen v-if="loading" />
        </Transition>

        <UAlert v-if="!loading && notFound" color="error" variant="subtle" title="Order not found" description="This order doesn't exist or isn't yours." />

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
                <OrderStatusBadge :status="order.status" />
            </div>

            <UAlert
                v-if="justPlaced"
                color="success"
                variant="subtle"
                icon="i-lucide-check"
                title="Order placed!"
                description="The seller will reach out to confirm."
            />

            <OrderInvoice v-if="isFinished" :order="order" />

            <UCard v-else :ui="{ body: 'p-0 sm:p-0' }">
                <div class="divide-y divide-default">
                    <div v-for="item in order.items" :key="item.uuid" class="p-4">
                        <OrderLineItem :item="item" />
                    </div>
                </div>

                <template #footer>
                    <div class="flex items-center justify-between font-medium text-highlighted">
                        <span>Total</span>
                        <span>₱{{ order.total_amount }}</span>
                    </div>
                </template>
            </UCard>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <BaseButton color="neutral" variant="soft" icon="i-lucide-receipt" to="/customer">
                    All orders
                </BaseButton>

                <div v-if="!isFinished" class="flex flex-wrap items-center gap-2">
                    <BaseButton
                        v-if="order.is_editable && order.pasabuy_schedule"
                        variant="soft"
                        icon="i-lucide-pencil"
                        :to="`/pasabuy/${order.pasabuy_schedule.uuid}`"
                    >
                        Edit order
                    </BaseButton>
                    <CancelOrderControl v-if="order.is_cancellable" :loading="cancelling" @confirm="cancelOrder" />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'
import type { Order } from '@/types/Order'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

const route = useRoute()
const toast = useToast()
const uuid = route.params.uuid as string
const justPlaced = computed(() => route.query.placed === '1')

const order = ref<Order | null>(null)
const loading = ref(true)
const notFound = ref(false)
const cancelling = ref(false)

const isFinished = computed(() => order.value?.pasabuy_schedule?.status === 'finished')

async function loadOrder(silent = false) {
    if (!silent) loading.value = true
    try {
        const response = await customerOrderService.fetchMyOrder(uuid)
        order.value = response.data
    } catch (error) {
        if (error instanceof APIError) {
            notFound.value = true
        } else if (!silent) {
            throw error
        }
    } finally {
        if (!silent) loading.value = false
    }
}

let pollHandle: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
    await loadOrder()
    pollHandle = setInterval(() => loadOrder(true), 30000)
})

onUnmounted(() => {
    if (pollHandle) clearInterval(pollHandle)
})

async function cancelOrder() {
    if (!order.value) return
    cancelling.value = true
    try {
        const response = await customerOrderService.cancelOrder(order.value.uuid)
        order.value = response.data
        toast.add({ title: 'Order cancelled', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to cancel', description: (error as APIError).message, color: 'error' })
    } finally {
        cancelling.value = false
    }
}
</script>
