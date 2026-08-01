<template>
    <BaseCard>
        <template #header>
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-medium">{{ title }}</h2>
                    <p v-if="hint" class="text-xs text-muted mt-0.5">{{ hint }}</p>
                </div>
                <UBadge v-if="count && count > 0" color="warning" variant="subtle">
                    {{ count }} pending
                </UBadge>
            </div>
        </template>

        <div v-if="loading" class="divide-y divide-default">
            <div v-for="n in 3" :key="n" class="flex items-center gap-3 py-3">
                <USkeleton class="size-9 shrink-0 rounded-full" />
                <div class="flex-1 space-y-1.5">
                    <USkeleton class="h-3.5 w-1/3" />
                    <USkeleton class="h-3 w-1/2" />
                </div>
                <USkeleton class="h-3.5 w-12 shrink-0" />
            </div>
        </div>
        <BaseEmptyState
            v-else-if="items.length === 0"
            icon="i-lucide-inbox"
            :message="emptyMessage"
        />
        <div v-else class="divide-y divide-default">
            <QueueRow
                v-for="item in items"
                :key="item.uuid"
                :name="item.name"
                :subtitle-label="item.subtitleLabel"
                :subtitle-href="item.subtitleHref"
                :timestamp="item.timestamp"
                :amount="item.amount"
                :menu-items="item.menuItems"
            />
        </div>

        <template v-if="viewAllHref" #footer>
            <NuxtLink :to="viewAllHref" class="text-primary text-sm font-medium hover:underline">
                {{ viewAllLabel }} ({{ count ?? items.length }})
            </NuxtLink>
        </template>
    </BaseCard>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

interface AttentionQueueItem {
    uuid: string
    name: string
    subtitleLabel: string
    subtitleHref?: string
    timestamp: string
    amount: string
    menuItems: DropdownMenuItem[]
}

withDefaults(defineProps<{
    title: string
    hint?: string
    count?: number
    items: AttentionQueueItem[]
    viewAllHref?: string
    viewAllLabel?: string
    loading?: boolean
    emptyMessage?: string
}>(), {
    viewAllLabel: 'View all',
    emptyMessage: 'No pending orders right now.'
})
</script>
