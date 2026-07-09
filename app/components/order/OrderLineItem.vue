<template>
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium text-highlighted">{{ group.item.product_name }}</p>
                <UBadge v-if="group.bonus" color="warning" variant="subtle" size="sm" icon="i-lucide-gift">B1T1</UBadge>
            </div>
            <p class="mt-0.5 text-sm text-muted">₱{{ group.item.actual_price ?? group.item.estimated_price }} × {{ group.item.quantity }}</p>
            <UBadge
                v-if="group.bonus"
                color="warning"
                variant="subtle"
                size="sm"
                icon="i-lucide-sparkles"
                class="mt-1.5"
            >
                +{{ group.bonus.quantity }} free
            </UBadge>
        </div>
        <div class="shrink-0 pt-0.5 text-right">
            <UBadge v-if="group.item.is_out_of_stock" color="error" variant="subtle" size="sm">
                Out of stock
            </UBadge>
            <p v-else class="font-medium text-highlighted">₱{{ group.item.subtotal }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { OrderItemGroup } from '@/composables/useOrderItemGroups'

interface LineItem {
    uuid: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_out_of_stock: boolean
    quantity: number
    subtotal: string
}

defineProps<{
    group: OrderItemGroup<LineItem>
}>()
</script>
