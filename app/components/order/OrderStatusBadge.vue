<template>
    <UBadge :color="customerOrderStatusColor[status]" variant="subtle">{{ customerOrderStatusLabel[status] }}</UBadge>
</template>

<script setup lang="ts">
defineProps<{
    status: string
}>()
</script>
