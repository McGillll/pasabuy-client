<template>
    <div class="relative min-h-screen flex items-center justify-center overflow-hidden bg-default px-4 py-12">
        <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-default via-muted to-default" />
        <div class="pointer-events-none absolute -top-32 -left-32 size-112 rounded-full bg-primary/30 blur-3xl" />
        <div class="pointer-events-none absolute -bottom-32 -right-32 size-112 rounded-full bg-primary/20 blur-3xl" />
        <div class="pointer-events-none absolute top-1/2 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-3xl" />

        <div class="relative w-full max-w-sm">
            <div class="flex flex-col items-center gap-3 mb-8">
                <div class="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-primary shadow-lg shadow-primary/30">
                    <DotLottieVue src="/lotties/logo-mark.lottie" autoplay loop class="size-16 scale-[1.45]" />
                </div>
                <div class="text-center">
                    <h1 class="text-xl font-semibold text-highlighted">Pasabuy</h1>
                    <p class="text-sm text-dimmed">{{ subtitle }}</p>
                </div>
            </div>

            <div class="rounded-2xl border border-default bg-elevated/20 p-8 shadow-2xl backdrop-blur-xl">
                <slot />
            </div>

            <slot name="footer" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

defineProps<{
    subtitle: string
}>()
</script>
