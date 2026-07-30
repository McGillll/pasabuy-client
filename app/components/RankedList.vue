<template>
    <BaseCard>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="font-medium">{{ title }}</h2>
                <UBadge v-if="month !== undefined && year !== undefined" color="neutral" variant="subtle" size="sm">
                    {{ monthLabel }} {{ year }}
                </UBadge>
            </div>
            <p v-if="hint" class="text-xs text-muted mt-0.5">{{ hint }}</p>
        </template>

        <BaseTabs
            v-if="tabs && tabs.length"
            :model-value="activeTab"
            :items="tabs"
            variant="pill"
            size="md"
            class="mb-4"
            :ui="{ list: 'w-full', trigger: 'flex-1 py-2' }"
            @update:model-value="(value) => emit('update:activeTab', value)"
        />

        <BaseEmptyState
            v-if="!loading && items.length === 0"
            :icon="emptyIcon"
            :message="emptyMessage"
            :description="emptyDescription"
        />
        <div v-else>
            <RankedRow
                v-for="item in items"
                :key="item.productId"
                :rank="item.rank"
                :name="item.name"
                :progress-pct="item.progressPct"
                :qty="item.qty"
                :unit="item.unit"
            />
        </div>
    </BaseCard>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

interface RankedListItem {
    productId: string | number
    rank: number
    name: string
    progressPct: number
    qty: string | number
    unit?: string
}

const props = withDefaults(defineProps<{
    title: string
    hint?: string
    items: RankedListItem[]
    loading?: boolean
    emptyMessage?: string
    emptyDescription?: string
    emptyIcon?: string
    tabs?: TabsItem[]
    activeTab?: string
    month?: number
    year?: number
}>(), {
    emptyMessage: 'Product rankings aren\'t available yet',
    emptyDescription: 'We\'ll show your best-selling products here once order data is available.',
    emptyIcon: 'i-lucide-bar-chart-3'
})

const emit = defineEmits<{
    'update:activeTab': [value: string]
}>()

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const monthLabel = computed(() => (props.month ? monthNames[props.month - 1] : ''))
</script>
