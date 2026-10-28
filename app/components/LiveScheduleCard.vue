<template>
    <BaseCard v-if="loading" :ui="{ body: 'space-y-4' }">
        <USkeleton class="h-3 w-24" />
        <USkeleton class="h-6 w-2/3" />
        <USkeleton class="h-4 w-1/3" />
        <div class="grid grid-cols-2 gap-3">
            <USkeleton class="h-16" />
            <USkeleton class="h-16" />
        </div>
        <USkeleton class="h-11 w-full sm:w-1/2" />
    </BaseCard>

    <BaseCard v-else-if="schedule" :ui="{ body: 'flex h-full flex-col gap-5' }">
        <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
                <p class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-dimmed">
                    <span class="size-2 rounded-full bg-success" />
                    Live pasabuy
                </p>
                <h2 class="mt-1 truncate text-xl font-semibold text-highlighted">{{ schedule.title }}</h2>
                <p v-if="cutoffCountdown" class="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-highlighted" role="timer">
                    <UIcon name="i-lucide-timer" class="size-4 text-warning" />
                    {{ cutoffCountdown }}
                </p>
                <p v-else-if="schedule.pasabuy_schedule_date" class="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted">
                    <UIcon name="i-lucide-alarm-clock" class="size-4 text-dimmed" />
                    Close by {{ formatDate(schedule.pasabuy_schedule_date) }}
                </p>
            </div>
            <BaseStatusBadge color="success" label="Open" dot />
        </div>

        <dl class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-elevated/60 p-3">
                <dt class="text-xs text-muted">Orders so far</dt>
                <dd class="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-highlighted">
                    <BaseNumber :value="orderCount" :maximum-fraction-digits="0" />
                </dd>
            </div>
            <div class="rounded-lg p-3" :class="pendingCount > 0 ? 'bg-warning/10' : 'bg-elevated/60'">
                <dt class="text-xs text-muted">Waiting on you</dt>
                <dd class="mt-0.5 font-mono text-2xl font-semibold tabular-nums" :class="pendingCount > 0 ? 'text-warning' : 'text-highlighted'">
                    <BaseNumber :value="pendingCount" :maximum-fraction-digits="0" />
                </dd>
            </div>
        </dl>

        <div class="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center">
            <BaseButton color="primary" variant="soft" icon="i-lucide-link" @click="copyLink">
                Copy share link
            </BaseButton>
            <BaseButton color="neutral" variant="outline" trailing-icon="i-lucide-arrow-right" :to="`/admin/schedules/${schedule.uuid}`">
                Open pasabuy
            </BaseButton>
            <NuxtLink
                v-if="otherOpenCount > 0"
                to="/admin/schedules"
                class="inline-flex min-h-11 items-center text-sm text-muted hover:text-highlighted sm:ml-auto"
            >
                +{{ otherOpenCount }} more open
            </NuxtLink>
        </div>
    </BaseCard>

    <BaseCard v-else :ui="{ body: 'flex h-full flex-col justify-center gap-1 py-8 text-center' }">
        <UIcon name="i-lucide-calendar-off" class="mx-auto size-6 text-dimmed" />
        <p class="font-medium text-highlighted">No pasabuy is open right now</p>
        <p class="text-sm text-muted">Open a schedule to start taking orders.</p>
    </BaseCard>
</template>

<script setup lang="ts">
import type { ScheduleBrowseItem } from '@/types/Schedule'

const props = withDefaults(defineProps<{
    schedule: ScheduleBrowseItem | null
    orderCount: number
    pendingCount: number
    otherOpenCount?: number
    loading?: boolean
}>(), {
    otherOpenCount: 0,
    loading: false
})

const toast = useToast()
const { copyTextAsync } = useAsyncClipboard()
const { closingCountdown } = useScheduleClosingSoon()

const cutoffCountdown = computed(() => props.schedule ? closingCountdown(props.schedule) : null)

async function copyLink() {
    if (!props.schedule) return
    const link = `${window.location.origin}/pasabuy/${props.schedule.uuid}`
    try {
        await copyTextAsync(async () => link)
        toast.add({ title: 'Link copied', color: 'success' })
    } catch {
        toast.add({ title: 'Couldn\'t copy the link', description: link, color: 'error' })
    }
}
</script>
