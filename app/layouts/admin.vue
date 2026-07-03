<template>
    <div class="min-h-screen bg-default">
        <header class="border-b border-default">
            <div class="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
                <div class="flex items-center gap-6">
                    <span class="font-semibold text-highlighted">Pasabuy</span>
                    <nav class="flex gap-4">
                        <NuxtLink
                            v-for="link in links"
                            :key="link.to"
                            :to="link.to"
                            class="text-sm text-muted hover:text-highlighted"
                            active-class="text-highlighted font-medium"
                        >
                            {{ link.label }}
                        </NuxtLink>
                    </nav>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-sm text-muted">{{ user?.name }}</span>
                    <UButton size="sm" color="neutral" variant="ghost" @click="logout">Log out</UButton>
                </div>
            </div>
        </header>
        <main class="mx-auto max-w-6xl px-4 py-6">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()

const links = [
    { label: 'Products', to: '/admin/products' },
    { label: 'Pasabuy Schedules', to: '/admin/schedules' }
]
</script>
