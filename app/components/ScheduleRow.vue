<template>
    <NuxtLink
        :to="href"
        class="flex flex-col gap-1.5 py-3 border-b border-default last:border-b-0 hover:text-highlighted"
        :class="closingSoon ? 'bg-warning/5 -mx-3 px-3' : ''"
    >
        <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UIcon name="i-lucide-calendar-clock" class="size-4" />
                </div>
                <span class="text-sm truncate">{{ title }}</span>
            </div>
            <BaseStatusBadge :color="statusColor" :label="statusLabel"/>
        </div>

        <div v-if="fillPct !== undefined && fillLabel" class="flex items-center gap-2">
            <BaseProgressBar class="flex-1" :segments="[{ value: fillPct }]" :max="100" />
            <span class="text-xs text-dimmed shrink-0">{{ fillLabel }}</span>
        </div>

        <div v-if="closingSoon && note" class="flex items-center gap-1 text-warning font-medium text-xs">
            <UIcon name="i-lucide-alarm-clock" class="size-3.5" />
            <span>{{ note }}</span>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

withDefaults(defineProps<{
    title: string
    status: 'open' | 'closed' | 'finished'
    statusColor: BadgeProps['color']
    statusLabel: string
    href: string
    closingSoon?: boolean
    fillPct?: number
    fillLabel?: string
    note?: string
}>(), {
    closingSoon: false
})
</script>
