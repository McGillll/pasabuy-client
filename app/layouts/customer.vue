<template>
    <div class="min-h-screen bg-default">
        <header class="border-b border-default">
            <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                <div class="flex items-center gap-6">
                    <NuxtLink to="/customer" class="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        <div class="flex items-center justify-center size-8 rounded-lg bg-primary text-inverted font-bold">
                            P
                        </div>
                        <span class="font-semibold text-highlighted">Pasabuy</span>
                    </NuxtLink>

                    <nav class="hidden md:flex items-center gap-1">
                        <NuxtLink
                            v-for="link in mobileLinks"
                            :key="link.label"
                            :to="link.to"
                            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-highlighted hover:bg-elevated"
                            active-class="text-primary hover:text-primary"
                        >
                            <UIcon :name="link.icon" class="size-5" />
                            {{ link.label }}
                        </NuxtLink>
                    </nav>
                </div>
                <div class="flex items-center gap-1">
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
        </header>

        <main class="mx-auto max-w-4xl px-4 py-6 pb-24 md:pb-6">
            <VerifyEmailBanner />
            <slot />
        </main>

        <nav class="md:hidden fixed inset-x-0 bottom-0 z-10 flex w-full border-t border-default bg-default pb-[env(safe-area-inset-bottom)]">
            <NuxtLink
                v-for="link in mobileLinks"
                :key="link.label"
                :to="link.to"
                class="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-2 text-muted"
                active-class="text-primary"
            >
                <UIcon :name="link.icon" class="size-6" />
                <span class="text-xs leading-tight">{{ link.label }}</span>
            </NuxtLink>
        </nav>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const { user, logout } = useAuth()

const accountMenuItems = computed<DropdownMenuItem[]>(() => [
    { label: 'My Account', icon: 'i-lucide-user', to: '/customer/account' },
    { label: 'Log out', icon: 'i-lucide-log-out', onSelect: () => logout('/login') }
])

const mobileLinks: NavigationMenuItem[] = [
    { label: 'Browse Pasabuys', icon: 'i-lucide-package-search', to: '/customer' },
    { label: 'My Orders', icon: 'i-lucide-receipt', to: '/customer/orders' }
]
</script>
