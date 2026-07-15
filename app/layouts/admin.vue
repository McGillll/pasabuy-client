<template>
    <div class="h-screen h-dvh flex bg-default overflow-hidden">
        <aside class="hidden md:flex md:w-64 md:flex-col md:shrink-0 border-r border-default">
            <div class="flex items-center gap-2 px-6 py-5">
                <div class="flex items-center justify-center size-8 rounded-lg bg-primary text-inverted font-bold">
                    P
                </div>
                <span class="font-semibold text-highlighted">Pasabuy</span>
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

        <div class="flex-1 min-w-0 flex flex-col">
            <header class="md:hidden border-b border-default">
                <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div class="flex items-center justify-center size-7 rounded-lg bg-primary text-inverted font-bold text-sm">
                            P
                        </div>
                        <span class="font-semibold text-highlighted">Pasabuy</span>
                    </div>
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
            </header>

            <main class="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
                <slot />
            </main>
        </div>

        <nav class="md:hidden fixed inset-x-0 bottom-0 z-10 flex w-full border-t border-default bg-default pb-[env(safe-area-inset-bottom)]">
            <NuxtLink
                v-for="link in mobileLinks"
                :key="link.to"
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
