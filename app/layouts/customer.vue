<template>
    <div class="min-h-screen bg-default">
        <header class="border-b border-default">
            <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center size-8 rounded-lg bg-primary text-inverted font-bold">
                        P
                    </div>
                    <span class="font-semibold text-highlighted">Pasabuy</span>
                </div>
                <div class="flex items-center gap-3">
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

        <main class="mx-auto max-w-4xl px-4 py-6">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, logout } = useAuth()

const accountMenuItems = computed<DropdownMenuItem[]>(() => [
    { label: 'My Account', icon: 'i-lucide-user', to: '/customer/account' },
    { label: 'Log out', icon: 'i-lucide-log-out', onSelect: () => logout('/login') }
])
</script>
