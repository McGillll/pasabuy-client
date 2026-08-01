<template>
    <BaseCard>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 class="font-medium">{{ title }}</h2>
                <div v-if="month !== undefined && year !== undefined" class="flex items-center gap-1">
                    <BaseIconButton
                        icon="i-lucide-chevron-left"
                        size="xs"
                        aria-label="Previous month"
                        @click="emit('change-month', -1)"
                    />
                    <UBadge color="neutral" variant="subtle" size="sm" class="whitespace-nowrap">
                        {{ monthLabel }} {{ year }}
                    </UBadge>
                    <BaseIconButton
                        icon="i-lucide-chevron-right"
                        size="xs"
                        aria-label="Next month"
                        :disabled="isCurrentMonth"
                        @click="emit('change-month', 1)"
                    />
                </div>
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

        <div v-if="loading" class="space-y-3">
            <div v-for="n in 5" :key="n" class="flex items-center gap-3 py-1">
                <USkeleton class="h-3 w-4" />
                <div class="flex-1 space-y-1.5">
                    <USkeleton class="h-3.5 w-2/3" />
                    <USkeleton class="h-1.5 w-full rounded-full" />
                </div>
                <USkeleton class="h-3.5 w-10 shrink-0" />
            </div>
        </div>
        <BaseEmptyState
            v-else-if="items.length === 0"
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
    'change-month': [delta: number]
}>()

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const monthLabel = computed(() => (props.month ? monthNames[props.month - 1] : ''))

const isCurrentMonth = computed(() => {
    const now = new Date()
    return props.month === now.getMonth() + 1 && props.year === now.getFullYear()
})
</script>
