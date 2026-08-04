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
        </template>
    </div>
</template>

<script setup lang="ts">
import { publicProductService } from '@/components/api/public/PublicProductService'
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'

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

onMounted(() => loadProduct())
watch(uuid, () => {
    product.value = getPreviewProduct(uuid.value)
    etag = null
    imageFailed.value = false
    loadProduct()
})
onPullToRefresh(() => loadProduct())
</script>
