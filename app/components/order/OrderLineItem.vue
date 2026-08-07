<template>
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium text-highlighted">{{ item.product_name }}</p>
                <UBadge v-if="item.bonus_quantity > 0" color="success" variant="subtle" size="sm" icon="i-lucide-gift">B1T1</UBadge>
            </div>
            <p class="mt-0.5 text-sm text-muted"><BaseNumber :value="item.actual_price ?? item.estimated_price" prefix="₱" class="font-mono tabular-nums" /> × <BaseNumber :value="item.quantity" /></p>
            <UBadge
                v-if="item.bonus_quantity > 0"
                color="success"
                variant="subtle"
                size="sm"
                icon="i-lucide-sparkles"
                class="mt-1.5"
            >
                +<BaseNumber :value="item.bonus_quantity" :maximum-fraction-digits="0" /> free
            </UBadge>
        </div>
        <div class="shrink-0 pt-0.5 text-right">
            <UBadge v-if="item.is_out_of_stock" color="error" variant="subtle" size="sm">
                Out of stock
            </UBadge>
            <BaseNumber v-else :value="item.subtotal" prefix="₱" class="font-mono font-medium tabular-nums text-highlighted" />
        </div>
    </div>
</template>

<script setup lang="ts">
interface LineItem {
    uuid: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_out_of_stock: boolean
    quantity: number
    bonus_quantity: number
    subtotal: string
}

defineProps<{
    item: LineItem
}>()
</script>
