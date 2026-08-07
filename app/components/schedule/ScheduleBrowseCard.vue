<template>
    <UCard
        :as="NuxtLink"
        :to="`/pasabuy/${schedule.uuid}`"
        class="min-h-11 cursor-pointer transition-colors hover:bg-elevated/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :ui="{ body: 'space-y-3' }"
    >
        <div class="flex items-start justify-between gap-2">
            <h2 class="line-clamp-1 font-semibold text-highlighted">{{ schedule.title }}</h2>
            <UIcon name="i-lucide-chevron-right" class="mt-0.5 size-4 shrink-0 text-dimmed" />
        </div>

        <p v-if="schedule.description" class="line-clamp-2 text-sm text-muted">{{ schedule.description }}</p>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span v-if="schedule.seller_name" class="inline-flex items-center gap-1.5">
                <UIcon name="i-lucide-store" class="size-4 text-dimmed" />
                {{ schedule.seller_name }}
            </span>
            <span v-if="schedule.pasabuy_schedule_date" class="inline-flex items-center gap-1.5">
                <UIcon name="i-lucide-alarm-clock" class="size-4 text-dimmed" />
                Close by {{ formatDate(schedule.pasabuy_schedule_date) }}
            </span>
        </div>

        <UBadge color="neutral" variant="subtle" size="sm">
            <BaseNumber :value="schedule.product_count ?? 0" :maximum-fraction-digits="0" />
            {{ schedule.product_count === 1 ? 'product' : 'products' }}
        </UBadge>
    </UCard>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import type { ScheduleBrowseItem } from '@/types/Schedule'

defineProps<{
    schedule: ScheduleBrowseItem
}>()
</script>
