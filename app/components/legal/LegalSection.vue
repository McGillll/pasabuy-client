<template>
    <section class="flex flex-col gap-2">
        <h2 class="text-base font-semibold text-highlighted sm:text-lg">{{ title }}</h2>
        <div class="flex flex-col gap-2 text-dimmed">
            <slot />
        </div>
    </section>
</template>

<script setup lang="ts">
defineProps<{
    title: string
}>()
</script>
