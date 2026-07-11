<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">My Account</h1>
            <p class="mt-1 text-sm text-muted">Update your profile details and password.</p>
        </div>

        <AccountSettingsForm />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: 'customer-auth' })
</script>
