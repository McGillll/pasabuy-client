<template>
    <div class="min-h-screen bg-default">
        <header class="border-b border-default shadow-chrome">
            <div class="bg-muted">
                <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
                    <NuxtLink to="/customer" class="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <div class="flex items-center justify-center size-11 rounded-2xl bg-primary text-inverted font-bold">
                            P
                        </div>
                        <span class="font-semibold text-highlighted">Pasabuy</span>
                    </NuxtLink>
                    <div id="customer-header-search-target" class="hidden min-w-0 max-w-sm flex-1 md:flex" />
                    <div class="ml-auto flex shrink-0 items-center gap-1">
                        <UColorModeButton color="neutral" variant="ghost" size="sm" square class="min-h-11 min-w-11 justify-center" />
                        <NuxtLink
                            v-if="isSuperadmin"
                            to="/admin"
                            class="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-highlighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="Switch to admin view"
                        >
                            <UIcon name="i-lucide-shield" class="size-5" />
                            <span class="hidden sm:inline">Admin view</span>
                        </NuxtLink>
                        <NuxtLink
                            to="/customer/account"
                            class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label="My account"
                        >
                            <BaseAvatar :name="fullName" size="sm" />
                            <span class="hidden text-sm font-medium text-highlighted sm:inline">{{ user?.first_name }} {{ user?.last_name }}</span>
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <nav ref="desktopNavEl" class="relative hidden border-t border-default bg-default md:flex">
                <div class="mx-auto flex max-w-7xl items-center px-4">
                    <NuxtLink
                        v-for="link in mobileLinks"
                        :key="link.label"
                        :to="link.to"
                        class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted transition-colors duration-200 hover:text-highlighted"
                        active-class="text-primary hover:text-primary"
                    >
                        <component
                            :is="link.icon"
                            class="size-4 motion-reduce:animate-none"
                            :class="isBasketLink(link) && cartBouncing ? 'animate-cart-bounce' : ''"
                        />
                        {{ link.label }}
                        <Transition
                            enter-active-class="transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                            enter-from-class="opacity-0 scale-50"
                            leave-active-class="transition duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                            leave-to-class="opacity-0 scale-50"
                        >
                            <UBadge
                                v-if="isBasketLink(link) && itemCount > 0"
                                color="error"
                                variant="solid"
                                size="sm"
                                class="rounded-full font-mono tabular-nums transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                                :class="badgePulsing ? 'scale-125' : 'scale-100'"
                            >
                                {{ itemCount > 99 ? '99+' : itemCount }}
                            </UBadge>
                        </Transition>
                    </NuxtLink>
                    <span
                        class="pointer-events-none absolute bottom-0 h-[2.5px] rounded-t-full bg-primary transition-opacity duration-150 ease-linear motion-reduce:transition-none"
                        :style="{ left: `${underlineLeft}px`, width: `${underlineWidth}px` }"
                    />
                </div>
            </nav>
        </header>

        <main class="mx-auto max-w-7xl px-4 py-6 pb-32 md:pb-6">
            <VerifyEmailBanner />
            <slot />
        </main>

        <nav class="md:hidden fixed inset-x-0 bottom-0 z-10 flex w-full bg-muted shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)]">
            <NuxtLink
                v-for="link in mobileLinks"
                :key="link.label"
                :to="link.to"
                class="group relative z-1 flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 py-2 text-muted transition-colors duration-200 motion-reduce:transition-none"
                active-class="text-primary"
            >
                <span
                    class="relative flex items-center justify-center rounded-full"
                    :class="isBasketLink(link) ? 'size-16 -translate-y-5 bg-elevated p-1.5' : 'size-11'"
                >
                    <!-- Blue Basket is the only element on this bar that ever raises into a
                    filled circle: it sits in its own "cradle" (a moat ring one token lighter
                    than the bar itself, per DESIGN.md's Ring Not Shadow Rule) topped with the
                    documented Brand Glow (shadow-primary/30) instead of an off-system black
                    shadow, so it reads as a permanent fixture and the one halo on the bar.
                    Siblings signal "active" with a real bounce (icon lift + scale, the
                    system's one signature motion) but never a filled circle, so Storefront
                    Blue's raised-circle treatment is never duplicated (One Signal Rule). The
                    resting `-translate-y-5`/`-translate-y-1` offsets below are structural, not
                    decorative, so only `transition`/`duration` are gated behind
                    `motion-reduce:*` -- never `transform` itself. -->
                    <span v-if="isBasketLink(link)" class="relative flex size-full items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                        <component
                            :is="link.icon"
                            class="size-5 scale-110 text-inverted motion-reduce:animate-none"
                            :class="cartBouncing ? 'animate-cart-bounce' : ''"
                        />
                        <Transition
                            enter-active-class="transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                            enter-from-class="opacity-0 scale-50"
                            leave-active-class="transition duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                            leave-to-class="opacity-0 scale-50"
                        >
                            <UBadge
                                v-if="itemCount > 0"
                                color="error"
                                variant="solid"
                                size="sm"
                                class="absolute -top-1 -right-1 min-w-4 justify-center rounded-full px-1 font-mono tabular-nums ring-2 ring-elevated transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                                :class="badgePulsing ? 'scale-125' : 'scale-100'"
                            >
                                {{ itemCount > 99 ? '99+' : itemCount }}
                            </UBadge>
                        </Transition>
                    </span>
                    <component
                        v-else
                        :is="link.icon"
                        class="size-5 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none group-[.text-primary]:-translate-y-1 group-[.text-primary]:scale-110"
                    />
                </span>
                <span class="text-xs leading-tight transition-colors duration-200 motion-reduce:transition-none group-[.text-primary]:font-semibold">{{ link.label }}</span>
            </NuxtLink>
        </nav>

        <WelcomeOverlay v-if="pendingWelcome" @dismiss="pendingWelcome = false" />
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import IconHome from '@/components/icons/IconHome.vue'
import IconAisles from '@/components/icons/IconAisles.vue'
import IconBasket from '@/components/icons/IconBasket.vue'
import IconPasabuys from '@/components/icons/IconPasabuys.vue'
import IconOrders from '@/components/icons/IconOrders.vue'

interface MobileNavLink {
    label: string
    icon: Component
    to: string
}

const { user, isSuperadmin } = useAuth()
const pendingWelcome = useWelcomeOverlay()
const route = useRoute()
const { itemCount, load: loadBasket } = useBasket()

const badgePulsing = ref(false)
let badgePulseTimeout: ReturnType<typeof setTimeout> | null = null

const cartBouncing = ref(false)
let cartBounceTimeout: ReturnType<typeof setTimeout> | null = null

watch(itemCount, (next, prev) => {
    if (next <= prev) return
    badgePulsing.value = false
    cartBouncing.value = false
    nextTick(() => {
        badgePulsing.value = true
        if (badgePulseTimeout) clearTimeout(badgePulseTimeout)
        badgePulseTimeout = setTimeout(() => { badgePulsing.value = false }, 260)

        cartBouncing.value = true
        if (cartBounceTimeout) clearTimeout(cartBounceTimeout)
        cartBounceTimeout = setTimeout(() => { cartBouncing.value = false }, 500)
    })
})

const fullName = computed(() => `${user.value?.first_name ?? ''} ${user.value?.last_name ?? ''}`.trim())

const mobileLinks: MobileNavLink[] = [
    { label: 'Home', icon: IconHome, to: '/customer' },
    { label: 'Aisles', icon: IconAisles, to: '/customer/aisles' },
    { label: 'Blue Basket', icon: IconBasket, to: '/customer/basket' },
    { label: 'Pasabuys', icon: IconPasabuys, to: '/customer/pasabuys' },
    { label: 'My Orders', icon: IconOrders, to: '/customer/orders' }
]

function isBasketLink(link: MobileNavLink) {
    return link.label === 'Blue Basket'
}

const activeLinkIndex = computed(() => {
    let bestIndex = 0
    let bestLength = -1

    mobileLinks.forEach((link, index) => {
        const to = link.to as string
        const matches = route.path === to || route.path.startsWith(`${to}/`)

        if (matches && to.length > bestLength) {
            bestIndex = index
            bestLength = to.length
        }
    })

    return bestIndex
})

const desktopNavEl = ref<HTMLElement | null>(null)
const underlineLeft = ref(0)
const underlineWidth = ref(0)

function updateUnderline() {
    const links = desktopNavEl.value?.querySelectorAll('a')
    const el = links?.[activeLinkIndex.value] as HTMLElement | undefined
    if (!el) return
    underlineLeft.value = el.offsetLeft
    underlineWidth.value = el.offsetWidth
}

watch(activeLinkIndex, () => nextTick(updateUnderline))

onMounted(() => {
    updateUnderline()
    window.addEventListener('resize', updateUnderline)
    loadBasket()
})

onUnmounted(() => {
    window.removeEventListener('resize', updateUnderline)
    if (badgePulseTimeout) clearTimeout(badgePulseTimeout)
    if (cartBounceTimeout) clearTimeout(cartBounceTimeout)
})
</script>
