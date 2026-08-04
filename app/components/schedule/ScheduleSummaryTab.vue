<template>
    <BaseTabs v-model="activeSummaryTab" :items="summaryTabs" class="w-full mt-4">
        <template #pricing>
            <SchedulePricingPanel :workspace="workspace" />
        </template>

        <template #checklist>
            <ScheduleChecklistPanel :workspace="workspace" />
        </template>
    </BaseTabs>
</template>

<script setup lang="ts">
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'
import type { TabsItem } from '@nuxt/ui'

defineProps<{
    workspace: ScheduleWorkspace
}>()

const activeSummaryTab = ref('pricing')

const summaryTabs: TabsItem[] = [
    { label: 'Price & Totals', icon: 'i-lucide-receipt-text', value: 'pricing', slot: 'pricing' },
    { label: 'Shopping Checklist', icon: 'i-lucide-list-checks', value: 'checklist', slot: 'checklist' }
]
</script>
