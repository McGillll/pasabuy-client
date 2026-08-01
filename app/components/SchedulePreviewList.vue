<template>
    <BaseCard>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="font-medium">{{ title }}</h2>
                <BaseButton v-if="viewAllHref" :to="viewAllHref" size="xs" color="neutral" variant="ghost">
                    {{ viewAllLabel }}
                </BaseButton>
            </div>
        </template>

        <div v-if="loading" class="divide-y divide-default">
            <div v-for="n in 3" :key="n" class="flex flex-col gap-1.5 py-3">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-2">
                        <USkeleton class="size-8 shrink-0 rounded-lg" />
                        <USkeleton class="h-3.5 w-32" />
                    </div>
                    <USkeleton class="h-5 w-14 rounded-full" />
                </div>
            </div>
        </div>

        <BaseEmptyState
            v-else-if="items.length === 0"
            icon="i-lucide-calendar-x"
            :message="emptyMessage"
        />

        <div v-else>
            <ScheduleRow
                v-for="item in items"
                :key="item.uuid"
                :title="item.title"
                :status="item.status"
                :status-color="item.statusColor"
                :status-label="item.statusLabel"
                :href="item.href"
                :closing-soon="item.closingSoon"
                :fill-pct="item.fillPct"
                :fill-label="item.fillLabel"
                :note="item.note"
            />
        </div>
    </BaseCard>
</template>

<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

interface ScheduleRowItem {
    uuid: string
    title: string
    status: 'open' | 'closed' | 'finished'
    statusColor: BadgeProps['color']
    statusLabel: string
    href: string
    closingSoon?: boolean
    fillPct?: number
    fillLabel?: string
    note?: string
}

withDefaults(defineProps<{
    title: string
    items: ScheduleRowItem[]
    viewAllHref?: string
    viewAllLabel?: string
    loading?: boolean
    emptyMessage?: string
}>(), {
    viewAllLabel: 'View all',
    loading: false,
    emptyMessage: 'No schedules yet.'
})
</script>
