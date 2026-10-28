<template>
    <div class="h-screen h-dvh flex bg-default overflow-hidden">
        <aside v-if="sidebarMode.mode.value === 'labeled'" class="hidden md:flex md:w-64 md:flex-col md:shrink-0 border-r border-default bg-muted shadow-[2px_0_10px_-4px_rgba(0,0,0,0.08)]">
            <div class="flex items-center justify-between gap-2 px-6 py-5">
                <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center size-11 rounded-2xl bg-primary text-inverted font-bold">
                        P
                    </div>
                    <span class="font-semibold text-highlighted">Pasabuy</span>
                </div>
                <div class="flex items-center gap-1">
                    <BaseIconButton
                        icon="i-lucide-panel-left-close"
                        aria-label="Toggle sidebar style"
                        @click="sidebarMode.toggle()"
                    />
                    <UColorModeButton color="neutral" variant="ghost" size="sm" square />
                </div>
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
                        <div class="flex min-w-0 items-center gap-2 text-left">
                            <BaseAvatar :name="fullName" size="sm" />
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-highlighted truncate">{{ user?.first_name }} {{ user?.last_name }}</p>
                                <p class="text-xs text-muted truncate">{{ user?.email }}</p>
                            </div>
                        </div>
                    </BaseButton>
                </UDropdownMenu>
            </div>
        </aside>

        <aside v-else class="hidden md:flex md:w-[76px] md:flex-col md:shrink-0 border-r border-default bg-muted shadow-[2px_0_10px_-4px_rgba(0,0,0,0.08)]">
            <div class="flex flex-col items-center gap-2 px-2 py-5">
                <div class="flex items-center justify-center size-11 rounded-2xl bg-primary text-inverted font-bold">
                    P
                </div>
                <BaseIconButton
                    icon="i-lucide-panel-left"
                    aria-label="Toggle sidebar style"
                    @click="sidebarMode.toggle()"
                />
            </div>

            <nav class="flex-1 flex flex-col items-center gap-2 px-2 py-2">
                <NuxtLink
                    v-for="link in links"
                    :key="link.label"
                    :to="link.to"
                    class="flex items-center justify-center size-11 rounded-lg text-muted hover:bg-elevated hover:text-highlighted transition-colors"
                    active-class="bg-primary/10 text-primary"
                >
                    <component :is="iconComponents[link.to as string]" class="size-6" />
                </NuxtLink>
            </nav>

            <div class="border-t border-default p-2 flex justify-center">
                <UDropdownMenu :items="accountMenuItems" :content="{ align: 'start' }" :ui="{ content: 'w-56' }">
                    <button type="button" class="rounded-lg transition-opacity hover:opacity-80" aria-label="Account menu">
                        <BaseAvatar :name="fullName" size="md" />
                    </button>
                </UDropdownMenu>
            </div>
        </aside>

        <div class="flex-1 min-w-0 min-h-0 flex flex-col">
            <header class="md:hidden border-b border-default bg-muted shadow-chrome">
                <div class="flex items-center justify-between px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div class="flex items-center justify-center size-11 rounded-2xl bg-primary text-inverted font-bold text-sm">
                            P
                        </div>
                        <span class="font-semibold text-highlighted">Pasabuy</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <UColorModeButton color="neutral" variant="ghost" size="sm" square class="min-h-11 min-w-11 justify-center" />
                        <UDropdownMenu :items="accountMenuItems" :content="{ align: 'end' }">
                            <button type="button" class="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-opacity hover:opacity-80" aria-label="Account menu">
                                <BaseAvatar :name="fullName" size="sm" />
                            </button>
                        </UDropdownMenu>
                    </div>
                </div>
            </header>

            <main class="flex-1 min-h-0 overflow-y-auto">
                <div class="p-6 pb-24 md:pb-6">
                    <VerifyEmailBanner />
                    <slot />
                </div>
            </main>
        </div>

        <nav class="md:hidden fixed inset-x-0 bottom-0 z-10 flex w-full bg-muted shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)]">
            <NuxtLink
                v-for="link in mobileLinks"
                :key="link.label"
                :to="link.to"
                class="group relative z-1 flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 py-2 text-muted transition-colors duration-200 motion-reduce:transition-none"
                active-class="text-primary"
            >
                <span class="flex size-10 items-center justify-center rounded-full transition-all duration-480 ease-[cubic-bezier(0.3,1.32,0.42,1)] motion-reduce:transition-none motion-reduce:transform-none group-[.text-primary]:size-11 group-[.text-primary]:-translate-y-3.25 group-[.text-primary]:bg-primary group-[.text-primary]:shadow-[0_14px_24px_-10px_rgba(0,0,0,0.45),0_4px_10px_-4px_rgba(0,0,0,0.3)]">
                    <component :is="iconComponents[link.to as string]" class="size-4.5 transition-transform duration-300 motion-reduce:transition-none group-[.text-primary]:scale-110 group-[.text-primary]:text-inverted" />
                </span>
                <span class="text-xs leading-tight transition-colors duration-200 motion-reduce:transition-none group-[.text-primary]:font-semibold">{{ link.label }}</span>
            </NuxtLink>
        </nav>
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import IconDashboard from '@/components/icons/IconDashboard.vue'
import IconProducts from '@/components/icons/IconProducts.vue'
import IconSchedules from '@/components/icons/IconSchedules.vue'
import IconCustomers from '@/components/icons/IconCustomers.vue'

const { user, isSuperadmin, logout } = useAuth()
const sidebarMode = useSidebarMode()

const fullName = computed(() => `${user.value?.first_name ?? ''} ${user.value?.last_name ?? ''}`.trim())

onMounted(() => {
    sidebarMode.init()
})

const accountMenuItems = computed<DropdownMenuItem[]>(() => [
    { label: 'My Account', icon: 'i-lucide-user', to: '/admin/account' },
    { label: 'Settings', icon: 'i-lucide-settings', to: '/admin/settings' },
    ...(isSuperadmin.value ? [{ label: 'Switch to customer view', icon: 'i-lucide-store', to: '/customer' }] : []),
    { label: 'Log out', icon: 'i-lucide-log-out', onSelect: () => logout('/login') }
])

const links: NavigationMenuItem[] = [
    { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin' },
    { label: 'Products', icon: 'i-lucide-package', to: '/admin/products' },
    { label: 'Pasabuy Schedules', icon: 'i-lucide-calendar-clock', to: '/admin/schedules' },
    { label: 'Customers', icon: 'i-lucide-users', to: '/admin/customers' }
]

const mobileLinks: NavigationMenuItem[] = [
    { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/admin' },
    { label: 'Products', icon: 'i-lucide-package', to: '/admin/products' },
    { label: 'Schedules', icon: 'i-lucide-calendar-clock', to: '/admin/schedules' },
    { label: 'Customers', icon: 'i-lucide-users', to: '/admin/customers' }
]

const iconComponents: Record<string, Component> = {
    '/admin': IconDashboard,
    '/admin/products': IconProducts,
    '/admin/schedules': IconSchedules,
    '/admin/customers': IconCustomers
}
</script>
