<template>
    <StatusBadge :color="customerOrderStatusColor[status]" :label="customerOrderStatusLabel[status]" />
</template>

<script setup lang="ts">
defineProps<{
    status: string
}>()
</script>
