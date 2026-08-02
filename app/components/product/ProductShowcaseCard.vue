<template>
    <button
        type="button"
        class="group flex min-h-11 flex-col overflow-hidden rounded-xl border border-default bg-default text-left shadow-sm transition-colors hover:bg-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        @click="emit('select', product)"
    >
        <div class="relative aspect-square w-full overflow-hidden bg-elevated" :class="{ 'opacity-60': isOutOfStock }">
            <img
                v-if="product.image_url && !imageFailed"
                :src="product.image_url"
                loading="lazy"
                class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                :alt="product.name"
                @error="imageFailed = true"
            >
            <div v-else class="flex size-full items-center justify-center text-dimmed">
                <UIcon name="i-lucide-image" class="size-8" />
            </div>

            <UBadge v-if="isB1T1" color="success" variant="solid" size="sm" class="absolute left-2 top-2">
                B1T1
            </UBadge>
            <UBadge v-else-if="isOutOfStock" color="error" variant="solid" size="sm" class="absolute left-2 top-2">
                Out of stock
            </UBadge>
        </div>

        <div class="flex flex-1 flex-col gap-1 p-3">
            <p v-if="product.category" class="truncate text-xs text-dimmed">{{ product.category.name }}</p>
            <p class="line-clamp-2 text-sm font-medium text-highlighted">{{ product.name }}</p>
            <p class="mt-auto font-mono text-base font-semibold tabular-nums text-highlighted">
                ₱{{ product.default_price }}
            </p>
        </div>
    </button>
</template>

<script setup lang="ts">
import type { Product } from '@/types/Product'

const props = defineProps<{
    product: Product
}>()

const emit = defineEmits<{
    select: [product: Product]
}>()

const imageFailed = ref(false)

const isB1T1 = computed(() => props.product.default_product_status === 'b1t1')
const isOutOfStock = computed(() => props.product.default_product_status === 'out_of_stock')
</script>
