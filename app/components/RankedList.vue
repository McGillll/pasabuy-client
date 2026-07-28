<template>
    <BaseCard>
        <template #header>
            <h2 class="font-medium">{{ title }}</h2>
        </template>

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
interface RankedListItem {
    productId: string | number
    rank: number
    name: string
    progressPct: number
    qty: string | number
    unit?: string
}

withDefaults(defineProps<{
    title: string
    items: RankedListItem[]
    loading?: boolean
    emptyMessage?: string
    emptyDescription?: string
    emptyIcon?: string
}>(), {
    emptyMessage: 'Product rankings aren\'t available yet',
    emptyDescription: 'We\'ll show your best-selling products here once order data is available.',
    emptyIcon: 'i-lucide-bar-chart-3'
})
</script>
