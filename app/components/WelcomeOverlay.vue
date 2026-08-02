<template>
    <ClientOnly>
        <Teleport to="body">
            <div
                ref="panelEl"
                class="fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-default px-4 py-12 transition-all duration-500 ease-out motion-reduce:transition-none"
                :class="entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
                @touchstart="onTouchStart"
                @touchmove="onTouchMove"
                @touchend="onTouchEnd"
                @touchcancel="onTouchEnd"
            >
                <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-default via-muted to-default" />
                <div class="pointer-events-none absolute -top-32 -left-32 size-112 rounded-full bg-primary/30 blur-3xl" />
                <div class="pointer-events-none absolute -bottom-32 -right-32 size-112 rounded-full bg-primary/20 blur-3xl" />
                <div class="pointer-events-none absolute top-1/2 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-3xl" />

                <div class="relative flex w-full max-w-sm flex-col items-center gap-8">
                    <div class="flex flex-col items-center gap-3">
                        <div class="flex items-center justify-center size-11 rounded-2xl bg-primary text-inverted font-bold text-2xl shadow-lg shadow-primary/30">
                            P
                        </div>
                        <p class="text-sm text-dimmed">{{ greeting }}</p>
                    </div>

                    <div class="w-full rounded-2xl border border-default bg-elevated/20 p-8 shadow-2xl backdrop-blur-xl" data-swipe-ignore>
                        <div class="mb-3 flex items-center gap-3">
                            <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <UIcon name="i-lucide-book-open" class="size-4" />
                            </div>
                            <p class="text-xs font-medium uppercase tracking-wide text-dimmed">Verse of the day</p>
                        </div>
                        <p class="text-lg font-medium leading-relaxed text-highlighted text-center">{{ verse.text }}</p>
                        <p class="mt-3 text-sm text-muted text-center">{{ verse.reference }}</p>
                    </div>

                    <div class="flex flex-col items-center gap-3">
                        <UIcon name="i-lucide-chevron-up" class="size-6 text-dimmed animate-pulse motion-reduce:animate-none" />
                        <p class="text-xs text-dimmed">Swipe up to continue</p>
                        <BaseButton color="neutral" variant="ghost" size="sm" data-swipe-ignore @click="triggerExit">
                            Continue
                        </BaseButton>
                    </div>
                </div>
            </div>
        </Teleport>
    </ClientOnly>
</template>

<script setup lang="ts">
const emit = defineEmits<{ dismiss: [] }>()

const { user } = useAuth()

const greeting = computed(() => user.value?.first_name ? `Welcome back, ${user.value.first_name}` : 'Welcome back')

const verse = useWelcomeVerse()
const entered = ref(false)

const { onTouchStart, onTouchMove, onTouchEnd, panelEl, triggerExit } = useSwipeDismiss(() => emit('dismiss'))

onMounted(() => {
    requestAnimationFrame(() => { entered.value = true })
})
</script>
