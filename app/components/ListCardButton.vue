<template>
    <BaseButton
        :icon="icon"
        color="neutral"
        variant="ghost"
        size="sm"
        class="rounded-lg"
    />
</template>

<script setup lang="ts">
defineProps<{
    icon: string
}>()
</script>
