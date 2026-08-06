<template>
    <div class="mx-auto max-w-5xl space-y-6">
        <BaseButton size="sm" color="neutral" variant="ghost" icon="i-lucide-arrow-left" class="-ml-2 md:hidden" @click="goBack(backTo)">
            Back
        </BaseButton>
        <BaseBreadcrumb :items="crumbs" class="hidden md:block" />

        <div v-if="loading" class="space-y-6 lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8 lg:space-y-0">
            <USkeleton class="aspect-square w-full rounded-xl" />
            <div class="space-y-4">
                <USkeleton class="h-6 w-2/3" />
                <USkeleton class="h-5 w-1/3" />
            </div>
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
            <div class="space-y-6 lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8 lg:space-y-0">
                <div class="overflow-hidden rounded-xl border border-default bg-elevated lg:sticky lg:top-6">
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

                <div class="space-y-6">
                    <div class="space-y-2">
                        <h1 class="text-xl font-semibold text-highlighted">{{ product.name }}</h1>

                        <div class="flex items-center gap-3">
                            <p class="font-mono text-2xl font-semibold tabular-nums text-highlighted">
                                ₱{{ product.default_price }}
                            </p>
                            <div v-if="product.default_product_status === 'b1t1'" class="flex items-center gap-1">
                                <UBadge
                                    color="success"
                                    variant="subtle"
                                    title="Buy 1 Take 1: order one, get an extra unit free"
                                >
                                    B1T1
                                </UBadge>
                                <BaseHelpTooltip ariaLabel="What is B1T1?">
                                    Buy 1 Take 1: order one, get an extra unit free.
                                </BaseHelpTooltip>
                            </div>
                            <UBadge v-else-if="product.default_product_status === 'out_of_stock'" color="error" variant="subtle">
                                Out of stock
                            </UBadge>
                        </div>
                    </div>

                    <p v-if="product.description" class="text-sm text-muted">{{ product.description }}</p>

                    <div v-if="product.default_product_status === 'out_of_stock'" class="rounded-xl border border-default bg-elevated/50 px-4 py-3 text-sm text-muted">
                        This item is currently out of stock.
                    </div>

                    <div class="flex items-center gap-4">
                        <BaseQuantityInput
                            v-model="basketQuantity"
                            :min="1"
                            size="lg"
                            color="neutral"
                            variant="subtle"
                            class="w-28 shrink-0"
                            :aria-label="`Quantity of ${product.name} to add to Blue Basket`"
                        />
                        <BaseButton color="primary" size="lg" class="flex-1" icon="i-lucide-shopping-basket" :loading="addingToBasket" @click="addToBlueBasket">
                            Add to Basket
                        </BaseButton>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { publicProductService } from '@/components/api/public/PublicProductService'
import APIError from '@/components/api/user/APIError'
import type { BaseBreadcrumbItem } from '@/components/base/BaseBreadcrumb.vue'
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

const toast = useToast()
const { add: addToBasket } = useBasket()
const basketQuantity = ref(1)
const addingToBasket = ref(false)

async function addToBlueBasket() {
    if (!product.value) return
    addingToBasket.value = true
    const success = await addToBasket(product.value.uuid, basketQuantity.value)
    addingToBasket.value = false
    if (success) {
        toast.add({ title: 'Added to Blue Basket', description: product.value.name, color: 'success' })
        basketQuantity.value = 1
    }
}

useHead({ title: computed(() => product.value?.name ?? 'Product') })

const { ancestors, resolve: resolveAncestors } = useCategoryAncestors()
const { goBack } = useSmartBack()

const backTo = computed(() => (product.value?.category ? `/customer/aisles/${product.value.category.uuid}` : '/customer/aisles'))

const crumbs = computed<BaseBreadcrumbItem[]>(() => {
    const trail: BaseBreadcrumbItem[] = [
        { label: 'Aisles', to: '/customer/aisles', onBack: () => goBack('/customer/aisles') },
        ...ancestors.value.map((ancestor) => ({
            label: ancestor.name,
            to: `/customer/aisles/${ancestor.uuid}`,
            onBack: () => goBack(`/customer/aisles/${ancestor.uuid}`)
        }))
    ]
    const category = product.value?.category
    if (category) {
        trail.push({
            label: category.name,
            to: `/customer/aisles/${category.uuid}`,
            onBack: () => goBack(`/customer/aisles/${category.uuid}`)
        })
    }
    return trail
})

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

watch(() => product.value?.category?.uuid, () => resolveAncestors(product.value?.category ?? null), { immediate: true })

onMounted(() => {
    loadProduct()
})
watch(uuid, () => {
    product.value = getPreviewProduct(uuid.value)
    etag = null
    imageFailed.value = false
    loadProduct()
})
onPullToRefresh(() => {
    loadProduct()
})
</script>
