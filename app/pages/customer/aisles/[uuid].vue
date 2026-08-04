<template>
    <AislesBrowser :category-uuid="uuid" />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

const route = useRoute()
const uuid = computed(() => route.params.uuid as string)
</script>
