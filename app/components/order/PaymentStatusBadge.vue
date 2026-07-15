<template>
    <StatusBadge :color="paymentStatusColor[status]" :label="paymentStatusLabel[status]" />
</template>

<script setup lang="ts">
import type { PaymentStatus } from '@/composables/useOrderStatus'

defineProps<{
    status: PaymentStatus
}>()
</script>
