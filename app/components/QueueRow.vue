<template>
    <div class="flex items-center gap-3 py-3">
        <BaseAvatar :name="name" size="md" />

        <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-highlighted truncate">{{ name }}</p>
            <NuxtLink
                v-if="subtitleHref"
                :to="subtitleHref"
                class="text-xs text-primary hover:underline truncate block"
            >
                {{ subtitleLabel }}
            </NuxtLink>
            <p v-else class="text-xs text-muted truncate">{{ subtitleLabel }}</p>
            <p class="text-xs text-dimmed">{{ timestamp }}</p>
        </div>

        <span class="text-sm font-medium text-highlighted shrink-0">{{ amount }}</span>

        <BaseKebabMenu :items="menuItems" />
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
    name: string
    subtitleLabel: string
    subtitleHref?: string
    timestamp: string
    amount: string
    menuItems: DropdownMenuItem[]
}>()
</script>
