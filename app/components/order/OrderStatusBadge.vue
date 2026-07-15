<template>
    <StatusBadge :color="customerOrderStatusColor[status]" :label="customerOrderStatusLabel[status]" />
</template>

<script setup lang="ts">
import type { CustomerOrderStatus } from '@/composables/useOrderStatus'

defineProps<{
    status: CustomerOrderStatus
}>()
</script>
