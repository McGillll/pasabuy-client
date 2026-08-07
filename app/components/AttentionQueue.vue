<template>
    <BaseCard>
        <template #header>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center size-10 rounded-lg bg-warning/10 text-warning shrink-0">
                        <UIcon name="i-lucide-inbox" class="size-5" />
                    </div>
                    <div>
                        <h2 class="flex items-center gap-1 font-semibold text-highlighted">
                            {{ title }}
                            <BaseHelpTooltip v-if="helpText">{{ helpText }}</BaseHelpTooltip>
                        </h2>
                        <p v-if="hint" class="text-xs text-muted mt-0.5">{{ hint }}</p>
                    </div>
                </div>
                <UBadge v-if="count && count > 0" color="warning" variant="subtle">
                    <BaseNumber :value="count" :maximum-fraction-digits="0" /> pending
                </UBadge>
            </div>
        </template>

        <Transition
            enter-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-150"
            leave-to-class="opacity-0"
            mode="out-in"
        >
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
            <TransitionGroup
                v-else
                tag="div"
                class="relative divide-y divide-default"
                move-class="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                enter-active-class="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                enter-from-class="opacity-0 -translate-y-1"
                leave-active-class="absolute w-full transition-all duration-200 ease-in"
                leave-to-class="opacity-0 scale-[0.98]"
            >
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
            </TransitionGroup>
        </Transition>

        <template v-if="viewAllHref" #footer>
            <NuxtLink :to="viewAllHref" class="text-primary text-sm font-medium hover:underline">
                {{ viewAllLabel }} (<BaseNumber :value="count ?? items.length" :maximum-fraction-digits="0" />)
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
    amount: string | number
    menuItems: DropdownMenuItem[]
}

withDefaults(defineProps<{
    title: string
    hint?: string
    helpText?: string
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
