<template>
    <div class="min-h-dvh bg-default">
        <!-- The brand panel lives in the layout (not the page) so it survives navigation
             between auth pages; on desktop it glides to whichever side the page asks for
             (route meta `authPanel`) while the form column slides the opposite way. -->
        <aside
            class="relative isolate overflow-hidden bg-primary-700 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:w-1/2 lg:transition-transform lg:duration-700 lg:ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
            :class="panelSide === 'right' ? 'lg:translate-x-full' : 'lg:translate-x-0'"
        >
            <!-- One photo per side, stacked; the active one cross-fades in as the panel slides.
                 The blue tint keeps the white copy legible over any photo. -->
            <img
                v-for="(src, side) in panelPhotos"
                :key="side"
                :src="src"
                alt=""
                decoding="async"
                class="absolute inset-0 -z-10 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none"
                :class="side === panelSide && loadedPhotos.has(side) ? 'opacity-100' : 'opacity-0'"
                aria-hidden="true"
                @load="loadedPhotos.add(side)"
            >
            <div class="absolute inset-0 -z-10 bg-linear-to-br from-primary-800/85 via-primary-700/75 to-primary-950/95" aria-hidden="true" />

            <!-- On desktop the content block hugs the panel's outer edge on either side, so the
                 free space always sits between the copy and the form; the margin animates
                 with the slide. -->
            <div
                class="flex flex-col gap-6 px-6 lg:relative py-8 sm:px-10 lg:min-h-dvh lg:w-md lg:justify-center lg:gap-10 lg:px-0 lg:py-12 lg:transition-[margin] lg:duration-700 lg:ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
                :class="panelSide === 'right' ? 'lg:ml-[calc(100%-28rem-3rem)] lg:text-right' : 'lg:ml-12'"
            >
                <!-- When the panel is on the right, the copy mirrors to align with its outer edge. -->
                <div class="flex items-center gap-3 lg:absolute lg:inset-x-0 lg:top-12" :class="{ 'lg:flex-row-reverse': panelSide === 'right' }">
                    <div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/25">
                        <DotLottieVue src="/lotties/logo-mark.lottie" autoplay loop class="size-12 scale-[1.45]" />
                    </div>
                    <span class="text-lg font-semibold">Pasabuy</span>
                </div>

                <Transition
                    mode="out-in"
                    enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
                    enter-from-class="opacity-0 translate-y-2"
                    leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
                    leave-to-class="opacity-0"
                >
                    <div :key="copyKey" class="space-y-6">
                        <p class="text-2xl font-semibold leading-tight lg:text-4xl">{{ copy.headline }}</p>
                        <ol class="hidden space-y-3 text-white/85 lg:block">
                            <li v-for="(point, index) in copy.points" :key="point.text" class="flex items-center gap-3" :class="{ 'lg:flex-row-reverse': panelSide === 'right' }">
                                <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm font-semibold">
                                    <UIcon v-if="point.icon" :name="point.icon" class="size-4" />
                                    <template v-else>{{ index + 1 }}</template>
                                </span>
                                {{ point.text }}
                            </li>
                        </ol>
                    </div>
                </Transition>
            </div>
        </aside>

        <main
            class="flex justify-center px-4 py-8 sm:py-12 lg:min-h-dvh lg:w-1/2 lg:items-center lg:transition-transform lg:duration-700 lg:ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
            :class="panelSide === 'right' ? 'lg:translate-x-0' : 'lg:translate-x-full'"
        >
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

interface PanelCopy {
    headline: string
    // A point without an icon renders as a numbered step.
    points: { icon?: string, text: string }[]
}

// Sign in talks to returning buyers; create account sets expectations with the real
// sign-up path, including the seller approval new accounts wait on. Other auth pages
// (forgot/reset password, verify email) keep the general pitch.
const PANEL_COPY: Record<'login' | 'register' | 'default', PanelCopy> = {
    login: {
        headline: 'Welcome back.',
        points: [
            { icon: 'i-lucide-store', text: 'See which pasabuys are open' },
            { icon: 'i-lucide-shopping-basket', text: 'Pick up your basket where you left it' },
            { icon: 'i-lucide-wallet', text: 'Check your orders and payments' }
        ]
    },
    register: {
        headline: 'Join the next pasabuy.',
        points: [
            { text: 'Create your account' },
            { text: 'The seller approves it' },
            { text: 'Order from any open pasabuy' }
        ]
    },
    default: {
        headline: 'Group-buys, sorted.',
        points: [
            { icon: 'i-lucide-store', text: 'Browse open pasabuys from any device' },
            { icon: 'i-lucide-shopping-basket', text: 'Order in a few taps, edit before cutoff' },
            { icon: 'i-lucide-wallet', text: 'Track your orders and payments in one place' }
        ]
    }
}

const route = useRoute()
const panelSide = computed(() => route.meta.authPanel ?? 'right')
const copyKey = computed<keyof typeof PANEL_COPY>(() => (route.name === 'login' || route.name === 'register' ? route.name : 'default'))
const copy = computed(() => PANEL_COPY[copyKey.value])

// Free Unsplash photos stored in public/img/bg (Unsplash License: commercial use, no
// attribution required). The premium_photo-* file there is Unsplash+ and stays out.
const PHOTO_POOL = [
    '/img/bg/photo-1542838132-92c53300491e.avif',
    '/img/bg/photo-1550989460-0adf9ea622e2.avif',
    '/img/bg/photo-1601600576337-c1d8a0d1373c.avif',
    '/img/bg/photo-1604719312566-8912e9227c6a.avif'
]

// Two different photos per visit, one for each panel side. Picked on the client so
// server and browser never disagree (no hydration mismatch); the layout persists across
// auth pages, so the pick holds while sliding between sign in and register.
const panelPhotos = ref<Partial<Record<'left' | 'right', string>>>({})

// Fade a photo in only once it has loaded, so the panel never flashes a half-drawn image;
// until then the tinted brand blue shows on its own.
const loadedPhotos = reactive(new Set<string>())

onMounted(() => {
    const shuffled = [...PHOTO_POOL].sort(() => Math.random() - 0.5)
    panelPhotos.value = { right: shuffled[0], left: shuffled[1] }
})
</script>
