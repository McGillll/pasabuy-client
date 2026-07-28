<template>
    <div class="h-screen h-dvh flex bg-default overflow-hidden">
        <aside class="hidden md:flex md:w-64 md:flex-col md:shrink-0 border-r border-default bg-muted shadow-[2px_0_10px_-4px_rgba(0,0,0,0.08)]">
            <div class="flex items-center justify-between gap-2 px-6 py-5">
                <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center size-8 rounded-lg bg-primary text-inverted font-bold">
                        P
                    </div>
                    <span class="font-semibold text-highlighted">Pasabuy</span>
                </div>
                <UColorModeButton color="neutral" variant="ghost" size="sm" square />
            </div>

            <UNavigationMenu
                orientation="vertical"
                highlight
                :items="links"
                :ui="{
                    root: 'gap-6',
                    link: 'px-3 py-2.5 text-base',
                    linkLeadingIcon: 'size-6'
                }"
                class="flex-1 px-2"
            />

            <div class="border-t border-default p-4">
                <UDropdownMenu :items="accountMenuItems" :content="{ align: 'start' }" :ui="{ content: 'w-56' }">
                    <BaseButton
                        block
                        color="neutral"
                        variant="ghost"
                        trailing-icon="i-lucide-chevron-down"
                        :ui="{ base: 'justify-between px-2 py-2 h-auto' }"
                    >
                        <div class="min-w-0 text-left">
                            <p class="text-sm font-medium text-highlighted truncate">{{ user?.first_name }} {{ user?.last_name }}</p>
                            <p class="text-xs text-muted truncate">{{ user?.email }}</p>
                        </div>
                    </BaseButton>
                </UDropdownMenu>
            </div>
        </aside>

        <div class="flex-1 min-w-0 min-h-0 flex flex-col">
            <header class="md:hidden border-b border-default bg-muted shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]">
                <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div class="flex items-center justify-center size-7 rounded-lg bg-primary text-inverted font-bold text-sm">
                            P
                        </div>
                        <span class="font-semibold text-highlighted">Pasabuy</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <UColorModeButton color="neutral" variant="ghost" size="sm" square class="min-h-11 min-w-11 justify-center" />
                        <UDropdownMenu :items="accountMenuItems" :content="{ align: 'end' }">
                            <BaseButton
                                color="neutral"
                                variant="ghost"
                                icon="i-lucide-user-round"
                                size="sm"
                                square
                                aria-label="Account menu"
                            />
                        </UDropdownMenu>
                    </div>
                </div>
            </header>

            <main class="flex-1 min-h-0 overflow-y-auto p-6 pb-24 md:pb-6">
                <VerifyEmailBanner />
                <slot />
            </main>
        </div>

        <nav class="md:hidden fixed inset-x-0 bottom-0 z-10 flex w-full border-t border-default bg-muted shadow-[0_-2px_10px_-4px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
            <NuxtLink
                v-for="link in mobileLinks"
                :key="link.label"
                :to="link.to"
                class="group flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-2 text-muted transition-colors duration-300 motion-reduce:transition-none"
                active-class="text-primary"
            >
                <span class="rounded-full px-3.5 py-1 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none motion-reduce:transform-none group-[.text-primary]:-translate-y-1 group-[.text-primary]:bg-primary group-[.text-primary]:scale-110">
                    <UIcon :name="link.icon" class="size-6 transition-colors duration-300 group-[.text-primary]:text-inverted" />
                </span>
                <span class="text-xs leading-tight transition-all duration-300 motion-reduce:transition-none group-[.text-primary]:font-semibold">{{ link.label }}</span>
            </NuxtLink>
        </nav>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const { user, logout } = useAuth()

const accountMenuItems = computed<DropdownMenuItem[]>(() => [
    { label: 'My Account', icon: 'i-lucide-user', to: '/admin/account' },
    { label: 'Customers', icon: 'i-lucide-users', to: '/admin/customers' },
    { label: 'Settings', icon: 'i-lucide-settings', to: '/admin/settings' },
    { label: 'Log out', icon: 'i-lucide-log-out', onSelect: () => logout('/login') }
])

const links: NavigationMenuItem[] = [
    { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin' },
    { label: 'Products', icon: 'i-lucide-package', to: '/admin/products' },
    { label: 'Pasabuy Schedules', icon: 'i-lucide-calendar-clock', to: '/admin/schedules' },
    { label: 'Orders', icon: 'i-lucide-receipt', to: '/admin/orders' }
]

const mobileLinks: NavigationMenuItem[] = [
    { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin' },
    { label: 'Products', icon: 'i-lucide-package', to: '/admin/products' },
    { label: 'Schedules', icon: 'i-lucide-calendar-clock', to: '/admin/schedules' },
    { label: 'Orders', icon: 'i-lucide-receipt', to: '/admin/orders' }
]
</script>
