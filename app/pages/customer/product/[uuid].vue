<template>
    <div class="space-y-6">
        <BaseButton size="sm" color="neutral" variant="ghost" icon="i-lucide-arrow-left" to="/customer" class="-ml-2">
            Home
        </BaseButton>

        <div v-if="loading" class="space-y-4">
            <USkeleton class="aspect-square w-full rounded-xl" />
            <USkeleton class="h-6 w-2/3" />
            <USkeleton class="h-5 w-1/3" />
        </div>

        <UAlert
            v-else-if="error"
            color="error"
            variant="subtle"
            title="Failed to load product"
            :description="error"
        >
            <template #actions>
                <BaseButton size="xs" color="error" variant="soft" @click="loadProduct">
                    Retry
                </BaseButton>
            </template>
        </UAlert>

        <UAlert
            v-else-if="notFound"
            color="error"
            variant="subtle"
            title="Product not found"
            description="This product doesn't exist or is no longer available."
        >
            <template #actions>
                <BaseButton size="xs" color="error" variant="soft" to="/customer">
                    Back to home
                </BaseButton>
            </template>
        </UAlert>

        <template v-else-if="product">
            <div class="overflow-hidden rounded-xl border border-default bg-elevated">
                <img
                    v-if="product.image_url && !imageFailed"
                    :src="product.image_url"
                    class="aspect-square w-full object-cover"
                    :alt="product.name"
                    @error="imageFailed = true"
                >
                <div v-else class="flex aspect-square w-full items-center justify-center text-dimmed">
                    <UIcon name="i-lucide-image" class="size-10" />
                </div>
            </div>

            <div class="space-y-2">
                <p v-if="product.category" class="text-sm text-dimmed">{{ product.category.name }}</p>
                <h1 class="text-xl font-semibold text-highlighted">{{ product.name }}</h1>

                <div class="flex items-center gap-3">
                    <p class="font-mono text-2xl font-semibold tabular-nums text-highlighted">
                        ₱{{ product.default_price }}
                    </p>
                    <UBadge
                        v-if="product.default_product_status === 'b1t1'"
                        color="success"
                        variant="subtle"
                        title="Buy 1 Take 1: order one, get an extra unit free"
                    >
                        B1T1
                    </UBadge>
                    <UBadge v-else-if="product.default_product_status === 'out_of_stock'" color="error" variant="subtle">
                        Out of stock
                    </UBadge>
                </div>
            </div>

            <p v-if="product.description" class="text-sm text-muted">{{ product.description }}</p>

            <div v-if="product.default_product_status === 'out_of_stock'" class="rounded-xl border border-default bg-elevated/50 px-4 py-3 text-sm text-muted">
                This item is currently out of stock.
            </div>

            <div v-else class="space-y-3">
                <h2 class="text-sm font-medium text-highlighted">Order this in a pasabuy</h2>

                <div v-if="schedulesLoading" class="space-y-2">
                    <USkeleton class="h-16 w-full rounded-xl" />
                    <USkeleton class="h-16 w-full rounded-xl" />
                </div>

                <div v-else-if="openSchedules.length === 0" class="flex flex-col items-center gap-2 rounded-xl border border-default bg-elevated/50 px-4 py-6 text-center">
                    <UIcon name="i-lucide-package-search" class="size-6 text-dimmed" />
                    <p class="text-sm text-muted">No pasabuys are open right now.</p>
                    <BaseButton size="sm" color="neutral" variant="soft" to="/customer/pasabuys">
                        Browse pasabuys
                    </BaseButton>
                </div>

                <template v-else>
                    <NuxtLink
                        v-for="schedule in openSchedules"
                        :key="schedule.uuid"
                        :to="`/pasabuy/${schedule.uuid}?product=${uuid}`"
                        class="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-default bg-elevated/50 px-4 py-3 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <div class="min-w-0">
                            <p class="truncate font-medium text-highlighted">{{ schedule.title }}</p>
                            <p v-if="schedule.seller_name" class="truncate text-sm text-muted">{{ schedule.seller_name }}</p>
                        </div>
                        <div class="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">
                            Order
                            <UIcon name="i-lucide-chevron-right" class="size-4" />
                        </div>
                    </NuxtLink>

                    <BaseButton
                        v-if="schedulesTotal > openSchedules.length"
                        size="sm"
                        color="neutral"
                        variant="ghost"
                        block
                        to="/customer/pasabuys"
                    >
                        See all open pasabuys
                    </BaseButton>
                </template>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { publicProductService } from '@/components/api/public/PublicProductService'
import { customerPasabuyScheduleService } from '@/components/api/customer/CustomerPasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'
import type { ScheduleBrowseItem } from '@/types/Schedule'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

const route = useRoute()
const uuid = computed(() => route.params.uuid as string)

const { get: getPreviewProduct } = useProductPreviewCache()

const product = ref<Product | null>(getPreviewProduct(uuid.value))
const loading = ref(!product.value)
const error = ref('')
const notFound = ref(false)
const imageFailed = ref(false)
let etag: string | null = null

const openSchedules = ref<ScheduleBrowseItem[]>([])
const schedulesLoading = ref(true)
const schedulesTotal = ref(0)
const SCHEDULES_PREVIEW_COUNT = 3

useHead({ title: computed(() => product.value?.name ?? 'Product') })

async function loadProduct() {
    const currentUuid = uuid.value
    if (!product.value) loading.value = true
    error.value = ''
    notFound.value = false
    try {
        const result = await publicProductService.fetchByUuidCacheable(currentUuid, etag)
        if (result !== 'not-modified') {
            product.value = result.data as Product
            etag = result.etag
        }
    } catch (err) {
        if (err instanceof APIError && err.status === 404) {
            notFound.value = true
            product.value = null
        } else {
            error.value = err instanceof APIError ? err.message : 'Something went wrong loading this product.'
        }
    } finally {
        loading.value = false
    }
}

async function loadOpenSchedules() {
    schedulesLoading.value = true
    try {
        const response = await customerPasabuyScheduleService.fetchOpenSchedules({ per_page: SCHEDULES_PREVIEW_COUNT })
        openSchedules.value = response.data.items
        schedulesTotal.value = response.data.total
    } catch {
        openSchedules.value = []
        schedulesTotal.value = 0
    } finally {
        schedulesLoading.value = false
    }
}

onMounted(() => {
    loadProduct()
    loadOpenSchedules()
})
watch(uuid, () => {
    product.value = getPreviewProduct(uuid.value)
    etag = null
    imageFailed.value = false
    loadProduct()
})
onPullToRefresh(() => {
    loadProduct()
    loadOpenSchedules()
})
</script>
