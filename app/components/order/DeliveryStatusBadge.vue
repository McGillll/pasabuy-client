<template>
    <BaseStatusBadge :color="deliveryStatusColor[status]" :label="deliveryStatusLabel[status]" dot />
</template>

<script setup lang="ts">
import { deliveryStatusColor, deliveryStatusLabel, type DeliveryStatus } from '@/composables/useOrderStatus'

defineProps<{
    status: DeliveryStatus
}>()
</script>
