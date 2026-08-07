<template>
    <button
        type="button"
        class="group relative flex min-h-11 flex-col overflow-hidden rounded-xl ring ring-default bg-default text-left shadow-sm transition-colors hover:bg-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-label="`Add ${name} to your order`"
        @click="emit('select')"
    >
        <div class="relative aspect-square w-full overflow-hidden bg-elevated" :class="{ 'opacity-60': status === 'out_of_stock' }">
            <img
                v-if="product.image_url && !imageFailed"
                :src="product.image_url"
                loading="lazy"
                class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                :alt="name"
                @error="imageFailed = true"
            >
            <div v-else class="flex size-full items-center justify-center text-dimmed">
                <UIcon name="i-lucide-image" class="size-8" />
            </div>

            <UBadge v-if="status === 'b1t1'" color="success" variant="subtle" size="sm" class="absolute left-2 top-2">
                B1T1
            </UBadge>
            <UBadge v-else-if="status === 'out_of_stock'" color="error" variant="subtle" size="sm" class="absolute left-2 top-2">
                Out of stock
            </UBadge>

            <UBadge
                v-if="quantity > 0"
                color="neutral"
                variant="solid"
                size="sm"
                class="absolute right-2 top-2"
            >
                <BaseNumber :value="quantity" :maximum-fraction-digits="0" />
            </UBadge>
        </div>

        <div class="flex flex-1 flex-col gap-1 p-3">
            <p class="line-clamp-2 text-sm font-medium text-highlighted">{{ name }}</p>
            <p class="mt-auto flex flex-wrap items-baseline gap-x-1.5 text-sm font-semibold text-highlighted">
                <BaseNumber :value="price" prefix="₱" class="font-mono tabular-nums" />
                <span class="font-sans text-xs font-normal text-dimmed">{{ confirmed ? 'confirmed' : 'estimated' }}</span>
            </p>
        </div>
    </button>
</template>

<script setup lang="ts">
import type { Product } from '@/types/Product'

defineProps<{
    product: Product
    name: string
    price: string
    confirmed: boolean
    status: 'none' | 'b1t1' | 'out_of_stock'
    quantity: number
}>()

const emit = defineEmits<{
    select: []
}>()

const imageFailed = ref(false)
</script>
