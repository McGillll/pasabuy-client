<template>
    <div class="w-full max-w-sm">
        <p class="mb-6 text-center text-sm text-muted">{{ subtitle }}</p>

        <div class="rounded-2xl border border-default bg-default p-6 shadow-sm sm:p-8">
            <slot />
        </div>

        <slot name="footer" />
    </div>
</template>

<script setup lang="ts">
// The form column of an auth page. The brand panel around it lives in layouts/auth.vue.
defineProps<{
    subtitle: string
}>()
</script>
