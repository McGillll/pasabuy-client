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

        <BaseEmptyState
            v-if="!loading && items.length === 0"
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
