<template>
    <div class="min-h-full max-w-2xl space-y-6">
        <AccountSettingsForm />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'My Account' })
</script>
