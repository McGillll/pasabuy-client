<template>
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium text-highlighted">{{ group.item.product_name }}</p>
                <UBadge v-if="group.bonus" color="warning" variant="subtle" size="sm" icon="i-lucide-gift">B1T1</UBadge>
            </div>
            <p class="mt-0.5 text-sm text-muted">₱{{ group.item.actual_price ?? group.item.estimated_price }} × {{ group.item.quantity }}</p>
            <p
                v-if="group.bonus"
                class="mt-1.5 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
            >
                <UIcon name="i-lucide-sparkles" class="size-3" />
                +{{ group.bonus.quantity }} free
            </p>
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
