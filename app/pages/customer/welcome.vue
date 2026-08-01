<template>
    <div class="space-y-6">
        <DailyVerseCard />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

useHead({ title: 'Pasabuy' })
</script>
