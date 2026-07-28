<template>
    <BaseStatusBadge :color="customerOrderStatusColor[status]" :label="customerOrderStatusLabel[status]" dot />
</template>

<script setup lang="ts">
import { customerOrderStatusColor, customerOrderStatusLabel, type CustomerOrderStatus } from '@/composables/useOrderStatus'

defineProps<{
    status: CustomerOrderStatus
}>()
</script>
