<template>
    <StatusBadge :color="deliveryStatusColor[status]" :label="deliveryStatusLabel[status]" />
</template>

<script setup lang="ts">
import type { DeliveryStatus } from '@/composables/useOrderStatus'

defineProps<{
    status: DeliveryStatus
}>()
</script>
