<template>
    <StatusBadge :color="deliveryStatusColor[status]" :label="deliveryStatusLabel[status]" />
</template>

<script setup lang="ts">
defineProps<{
    status: string
}>()
</script>
