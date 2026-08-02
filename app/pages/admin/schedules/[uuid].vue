<template>
    <div v-if="workspace.loading" class="space-y-6">
        <USkeleton class="h-7 w-64" />
        <USkeleton class="h-10 w-full max-w-md" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-64 w-full" />
    </div>

    <UAlert
        v-else-if="!workspace.schedule"
        color="neutral"
        variant="subtle"
        icon="i-lucide-search-x"
        title="Schedule not found"
        description="This schedule may have been deleted, or the link is incorrect."
    />

    <div v-else class="min-h-full space-y-6" @touchstart="onTabsTouchStart" @touchmove="onTabsTouchMove" @touchend="onTabsTouchEnd">
        <div class="sticky top-0 z-10 -mx-6 flex items-center gap-2 border-b border-default bg-default px-6 py-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]">
            <h1 class="truncate text-xl font-semibold text-highlighted">{{ workspace.schedule.title }}</h1>
            <UBadge :color="scheduleStatusColor" variant="subtle" class="shrink-0">
                {{ scheduleStatusLabel }}
            </UBadge>
        </div>

        <BaseTabs v-model="activeTab" :items="tabs" variant="link" class="w-full">
            <template #details>
                <div class="overflow-hidden">
                    <div ref="panelEl">
                        <ScheduleDetailsTab :workspace="workspace" />
                    </div>
                </div>
            </template>

            <template #summary>
                <div class="overflow-hidden">
                    <div ref="panelEl">
                        <ScheduleSummaryTab :workspace="workspace" />
                    </div>
                </div>
            </template>

            <template #orders>
                <div class="overflow-hidden">
                    <div ref="panelEl">
                        <ScheduleOrdersTab :workspace="workspace" />
                    </div>
                </div>
            </template>
        </BaseTabs>

        <ScheduleBuyersPriceModal :workspace="workspace" />
        <ScheduleOrderDetailModal :workspace="workspace" />
        <ScheduleFinishModal :workspace="workspace" />

        <BaseConfirmModal
            v-model:open="workspace.confirmDialog.open"
            :title="workspace.confirmDialog.title"
            :description="workspace.confirmDialog.description"
            :color="workspace.confirmDialog.color"
            :confirm-label="workspace.confirmDialog.confirmLabel"
            :loading="workspace.confirming"
            @confirm="workspace.confirmDialogAccept"
        />
    </div>
</template>

<script setup lang="ts">
import { useScheduleWorkspace } from '@/composables/useScheduleWorkspace'
import type { TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const uuid = route.params.uuid as string

const workspace = useScheduleWorkspace(uuid)

useHead({ title: computed(() => workspace.schedule?.title ?? 'Schedule Details') })

const activeTab = ref('summary')

const scheduleStatusLabel = computed(() => {
    const status = workspace.schedule?.status
    if (status === 'open') return 'Open'
    if (status === 'closed') return 'Closed'
    return 'Finished'
})

const scheduleStatusColor = computed(() => {
    const status = workspace.schedule?.status
    if (status === 'open') return 'primary' as const
    if (status === 'closed') return 'warning' as const
    return 'success' as const
})

const tabs = computed<TabsItem[]>(() => [
    { label: 'Details', icon: 'i-lucide-file-text', value: 'details', slot: 'details' },
    { label: 'Summary', icon: 'i-lucide-clipboard-list', value: 'summary', slot: 'summary' },
    {
        label: 'Orders',
        icon: 'i-lucide-receipt',
        value: 'orders',
        slot: 'orders',
        badge: workspace.pendingOrderCount > 0 ? workspace.pendingOrderCount : undefined
    }
])

const { onTouchStart: onTabsTouchStart, onTouchMove: onTabsTouchMove, onTouchEnd: onTabsTouchEnd, panelEl } = useSwipeTabs(
    activeTab,
    computed(() => tabs.value.map((tab) => tab.value as string))
)

onMounted(workspace.loadAll)
onPullToRefresh(workspace.pullRefresh)
</script>
