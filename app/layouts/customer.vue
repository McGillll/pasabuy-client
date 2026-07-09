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
                    <span class="hidden text-sm text-muted sm:inline">{{ user?.first_name }} {{ user?.last_name }}</span>
                    <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-log-out" @click="logout('/customer/login')">
                        Log out
                    </UButton>
                </div>
            </div>
        </header>

        <main class="mx-auto max-w-4xl px-4 py-6">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()
</script>
