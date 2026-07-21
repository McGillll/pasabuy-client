<template>
    <div class="min-h-screen bg-default">
        <header class="sticky top-0 z-10 border-b border-default bg-default/80 backdrop-blur-xl">
            <div class="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
                <BaseButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-arrow-left"
                    size="sm"
                    square
                    aria-label="Go back"
                    class="min-h-11 min-w-11 justify-center"
                    @click="goBack"
                />
                <h1 class="font-semibold text-highlighted">{{ title }}</h1>
            </div>
        </header>

        <main class="mx-auto max-w-2xl px-4 py-6">
            <p class="mb-6 text-sm text-dimmed">Last updated: {{ lastUpdated }}</p>
            <div class="flex flex-col gap-6 text-sm leading-relaxed text-default sm:text-base">
                <slot />
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string
    lastUpdated: string
}>()

const router = useRouter()
const route = useRoute()

function goBack() {
    const from = route.query.from
    if (typeof from === 'string' && from) {
        navigateTo(`/${from}`)
        return
    }
    if (window.history.length > 1) router.back()
    else navigateTo('/')
}
</script>
