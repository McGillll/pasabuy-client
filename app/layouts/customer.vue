<template>
    <div class="min-h-screen bg-default">
        <header class="border-b border-default shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]">
            <div class="bg-muted">
                <div class="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
                    <NuxtLink to="/customer" class="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <div class="flex items-center justify-center size-11 rounded-2xl bg-primary text-inverted font-bold">
                            P
                        </div>
                        <span class="font-semibold text-highlighted">Pasabuy</span>
                    </NuxtLink>
                    <div id="customer-header-search-target" class="hidden min-w-0 max-w-sm flex-1 md:flex" />
                    <div class="ml-auto flex shrink-0 items-center gap-1">
                        <UColorModeButton color="neutral" variant="ghost" size="sm" square class="min-h-11 min-w-11 justify-center" />
                        <UDropdownMenu :items="accountMenuItems" :content="{ align: 'end' }">
                            <BaseButton
                                color="neutral"
                                variant="ghost"
                                trailing-icon="i-lucide-chevron-down"
                                size="sm"
                                aria-label="Account menu"
                            >
                                <span class="hidden sm:inline">{{ user?.first_name }} {{ user?.last_name }}</span>
                                <UIcon name="i-lucide-user-round" class="sm:hidden size-5" />
                            </BaseButton>
                        </UDropdownMenu>
                    </div>
                </div>
            </div>

            <nav ref="desktopNavEl" class="relative hidden border-t border-default bg-default md:flex">
                <div class="mx-auto flex max-w-4xl items-center px-4">
                    <NuxtLink
                        v-for="link in mobileLinks"
                        :key="link.label"
                        :to="link.to"
                        class="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted transition-colors duration-200 hover:text-highlighted"
                        active-class="text-primary hover:text-primary"
                    >
                        <UIcon :name="link.icon" class="size-4" />
                        {{ link.label }}
                    </NuxtLink>
                    <span
                        class="pointer-events-none absolute bottom-0 h-[2.5px] rounded-t-full bg-primary transition-[left,width] duration-320 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                        :style="{ left: `${underlineLeft}px`, width: `${underlineWidth}px` }"
                    />
                </div>
            </nav>
        </header>

        <main class="mx-auto max-w-4xl px-4 py-6 pb-24 md:pb-6">
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
                <span class="flex size-11 items-center justify-center rounded-full transition-all duration-480 ease-[cubic-bezier(0.3,1.32,0.42,1)] motion-reduce:transition-none motion-reduce:transform-none group-[.text-primary]:size-13 group-[.text-primary]:-translate-y-4.5 group-[.text-primary]:bg-primary group-[.text-primary]:shadow-[0_14px_24px_-10px_rgba(0,0,0,0.45),0_4px_10px_-4px_rgba(0,0,0,0.3)]">
                    <UIcon :name="link.icon" class="size-5 transition-transform duration-300 motion-reduce:transition-none group-[.text-primary]:scale-110 group-[.text-primary]:text-inverted" />
                </span>
                <span class="text-xs leading-tight transition-colors duration-200 motion-reduce:transition-none group-[.text-primary]:font-semibold">{{ link.label }}</span>
            </NuxtLink>
        </nav>

        <WelcomeOverlay v-if="pendingWelcome" @dismiss="pendingWelcome = false" />
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const { user, logout } = useAuth()
const pendingWelcome = useWelcomeOverlay()
const route = useRoute()

const accountMenuItems = computed<DropdownMenuItem[]>(() => [
    { label: 'My Account', icon: 'i-lucide-user', to: '/customer/account' },
    { label: 'Log out', icon: 'i-lucide-log-out', onSelect: () => logout('/login') }
])

const mobileLinks: NavigationMenuItem[] = [
    { label: 'Home', icon: 'i-lucide-layout-dashboard', to: '/customer' },
    { label: 'Aisles', icon: 'i-lucide-shopping-basket', to: '/customer/aisles' },
    { label: 'Pasabuys', icon: 'i-lucide-package-search', to: '/customer/pasabuys' },
    { label: 'My Orders', icon: 'i-lucide-receipt', to: '/customer/orders' }
]

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
})

onUnmounted(() => {
    window.removeEventListener('resize', updateUnderline)
})
</script>
