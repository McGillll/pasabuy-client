<script setup lang="ts">
import { publicPasabuyService } from '@/components/api/public/PublicPasabuyService'
import APIError from '@/components/api/user/APIError'

definePageMeta({ layout: false })

interface Product {
    uuid: string
    name: string
    description: string | null
    image_url: string | null
    is_active: boolean
}

interface ScheduleProduct {
    uuid: string
    price: string
    max_quantity: number | null
    product: Product
}

interface Schedule {
    uuid: string
    title: string
    description: string | null
    status: string
    is_open: boolean
    products: ScheduleProduct[]
}

interface OrderResult {
    uuid: string
    customer_name: string
    total_amount: string
}

const route = useRoute()
const uuid = route.params.uuid as string

const schedule = ref<Schedule | null>(null)
const loading = ref(true)
const notFound = ref(false)

const quantities = ref<Record<string, number>>({})
const customerName = ref('')
const customerContact = ref('')
const submitting = ref(false)
const submitError = ref<string | null>(null)
const orderResult = ref<OrderResult | null>(null)

const total = computed(() => {
    if (!schedule.value) return 0
    return schedule.value.products.reduce((sum, sp) => {
        const qty = quantities.value[sp.product.uuid] || 0
        return sum + qty * Number(sp.price)
    }, 0)
})

const hasItems = computed(() => Object.values(quantities.value).some((qty) => qty > 0))

async function load() {
    loading.value = true
    try {
        const response = await publicPasabuyService.fetchSchedule(uuid)
        schedule.value = response.data
        for (const sp of schedule.value!.products) {
            quantities.value[sp.product.uuid] = 0
        }
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

function increment(sp: ScheduleProduct) {
    const current = quantities.value[sp.product.uuid] || 0
    if (sp.max_quantity !== null && current >= sp.max_quantity) return
    quantities.value[sp.product.uuid] = current + 1
}

function decrement(sp: ScheduleProduct) {
    const current = quantities.value[sp.product.uuid] || 0
    quantities.value[sp.product.uuid] = Math.max(0, current - 1)
}

async function submitOrder() {
    submitError.value = null
    submitting.value = true
    try {
        const items = Object.entries(quantities.value)
            .filter(([, qty]) => qty > 0)
            .map(([product_uuid, quantity]) => ({ product_uuid, quantity }))

        const response = await publicPasabuyService.placeOrder(uuid, customerName.value, customerContact.value, items)
        orderResult.value = response.data
    } catch (error) {
        submitError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        submitting.value = false
    }
}

onMounted(load)
</script>

<template>
    <div class="min-h-screen bg-default px-4 py-8">
        <div class="mx-auto max-w-2xl space-y-6">
            <div v-if="loading" class="text-center text-muted">Loading…</div>

            <UAlert v-else-if="notFound" color="error" variant="subtle" title="Pasabuy not found" description="This link doesn't point to a valid pasabuy." />

            <template v-else-if="schedule">
                <div>
                    <h1 class="text-2xl font-semibold text-highlighted">{{ schedule.title }}</h1>
                    <p v-if="schedule.description" class="mt-1 text-muted">{{ schedule.description }}</p>
                </div>

                <UAlert
                    v-if="!schedule.is_open"
                    color="warning"
                    variant="subtle"
                    title="This pasabuy is closed"
                    description="Ordering is no longer available for this pasabuy."
                />

                <UCard v-if="!orderResult">
                    <template #header>
                        <h2 class="font-medium">Items</h2>
                    </template>
                    <div class="space-y-3">
                        <div
                            v-for="sp in schedule.products"
                            :key="sp.uuid"
                            class="flex items-center gap-4 border-b border-default pb-3 last:border-0"
                        >
                            <img
                                v-if="sp.product.image_url"
                                :src="sp.product.image_url"
                                class="size-12 rounded object-cover"
                                alt=""
                            >
                            <div v-else class="size-12 rounded bg-elevated" />
                            <div class="flex-1">
                                <p class="font-medium">{{ sp.product.name }}</p>
                                <p class="text-sm text-muted">₱{{ sp.price }}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <UButton
                                    icon="i-lucide-minus"
                                    size="xs"
                                    color="neutral"
                                    variant="soft"
                                    :disabled="!schedule.is_open"
                                    @click="decrement(sp)"
                                />
                                <span class="w-6 text-center">{{ quantities[sp.product.uuid] || 0 }}</span>
                                <UButton
                                    icon="i-lucide-plus"
                                    size="xs"
                                    color="neutral"
                                    variant="soft"
                                    :disabled="!schedule.is_open"
                                    @click="increment(sp)"
                                />
                            </div>
                        </div>
                    </div>

                    <template #footer>
                        <div class="space-y-4">
                            <div class="flex justify-between font-medium">
                                <span>Total</span>
                                <span>₱{{ total.toFixed(2) }}</span>
                            </div>

                            <UFormField label="Your name" required>
                                <UInput v-model="customerName" class="w-full" />
                            </UFormField>
                            <UFormField label="Contact number / Messenger" required>
                                <UInput v-model="customerContact" class="w-full" />
                            </UFormField>

                            <UAlert v-if="submitError" color="error" variant="subtle" :title="submitError" />

                            <UButton
                                block
                                :loading="submitting"
                                :disabled="!schedule.is_open || !hasItems || !customerName || !customerContact"
                                @click="submitOrder"
                            >
                                Place order
                            </UButton>
                        </div>
                    </template>
                </UCard>

                <UAlert
                    v-else
                    color="success"
                    variant="subtle"
                    title="Order placed!"
                    :description="`Thanks, ${orderResult.customer_name}! Your total is ₱${orderResult.total_amount}. The seller will reach out to confirm.`"
                />
            </template>
        </div>
    </div>
</template>
