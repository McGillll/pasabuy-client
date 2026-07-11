<template>
    <StatusBadge :color="paymentStatusColor[status]" :label="paymentStatusLabel[status]" />
</template>

<script setup lang="ts">
defineProps<{
    status: string
}>()
</script>
