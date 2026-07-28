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

        <BaseEmptyState
            v-if="!loading && items.length === 0"
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
