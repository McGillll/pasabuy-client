<template>
    <BaseStatusBadge :color="paymentStatusColor[status]" :label="paymentStatusLabel[status]" dot />
</template>

<script setup lang="ts">
import { paymentStatusColor, paymentStatusLabel, type PaymentStatus } from '@/composables/useOrderStatus'

defineProps<{
    status: PaymentStatus
}>()
</script>
