<template>
    <div>
        <EntityFilterBar v-model="workspace.pricingSearch" placeholder="Search products…">
            <div v-if="workspace.pricingCategoryOptions.length > 2">
                <ChipOverflowFilter
                    v-model="workspace.pricingCategoryFilter"
                    :items="workspace.pricingCategoryOptions"
                    :visible-count="6"
                    title="All categories"
                    search-placeholder="Search categories…"
                />
            </div>
        </EntityFilterBar>

        <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
            <template v-if="workspace.summary.length > 0" #header>
                <div class="flex items-center justify-between font-medium text-highlighted">
                    <span class="inline-flex items-center gap-1">
                        Grand total
                        <BaseHelpTooltip>
                            Excludes products marked out of stock. Quantities for B1T1 products are already doubled to reflect the free bonus item.
                        </BaseHelpTooltip>
                    </span>
                    <span class="font-mono tabular-nums">₱{{ workspace.summaryGrandTotal.toFixed(2) }}</span>
                </div>
            </template>
            <BaseTable
                :data="pagedSummary"
                :columns="summaryColumns"
                :ui="{ tr: 'hover:bg-elevated/50 transition-colors cursor-pointer' }"
                @select="(_event: Event, row: { original: ScheduleSummaryItem }) => workspace.openBuyersModal(row.original)"
            >
                <template #product_name-cell="{ row }">
                    <div class="flex items-center gap-2">
                        <p class="font-medium text-highlighted">{{ row.original.product_name }}</p>
                        <UBadge v-if="workspace.getScheduleProductStatus(row.original.product_uuid) === 'b1t1'" color="warning" variant="subtle" size="sm">
                            B1T1
                        </UBadge>
                        <UBadge v-else-if="workspace.getScheduleProductStatus(row.original.product_uuid) === 'out_of_stock'" color="error" variant="subtle" size="sm">
                            Out of stock
                        </UBadge>
                    </div>
                    <p class="text-sm text-muted">{{ row.original.category_name ?? '-' }}</p>
                </template>
                <template #default_price-cell="{ row }">
                    <span class="font-mono tabular-nums">₱{{ row.original.default_price }}</span>
                </template>
                <template #total_quantity-cell="{ row }">
                    <span class="font-mono tabular-nums">{{ workspace.getDisplayQuantity(row.original) }}</span>
                </template>
                <template #subtotal-cell="{ row }">
                    <span v-if="workspace.getScheduleProductStatus(row.original.product_uuid) === 'out_of_stock'" class="text-sm font-medium text-error">
                        Out of stock
                    </span>
                    <span v-else class="font-mono tabular-nums">₱{{ row.original.subtotal }}</span>
                </template>
                <template #list-item="{ item }">
                    <ListCard
                        clickable
                        :chevron="false"
                        @click="workspace.openBuyersModal(item)"
                    >
                        <template #title>
                            <p class="font-medium text-highlighted">{{ item.product_name }}</p>
                        </template>
                        <template #subtitle>
                            {{ item.category_name ?? '-' }}
                        </template>
                        <template #meta>
                            <span class="text-muted font-mono tabular-nums">₱{{ item.default_price }} × {{ workspace.getDisplayQuantity(item) }}</span>
                            <span v-if="workspace.getScheduleProductStatus(item.product_uuid) === 'out_of_stock'" class="font-medium text-error">
                                Out of stock
                            </span>
                            <span v-else class="font-medium text-highlighted font-mono tabular-nums">₱{{ item.subtotal }}</span>
                        </template>
                        <template v-if="workspace.getScheduleProductStatus(item.product_uuid) === 'b1t1'" #status>
                            <UBadge color="warning" variant="subtle" size="sm">
                                B1T1
                            </UBadge>
                        </template>
                    </ListCard>
                </template>
                <template #empty>
                    <BaseEmptyState
                        icon="i-lucide-clipboard-list"
                        :message="workspace.summary.length === 0 ? 'No orders yet. The checklist fills in once customers order.' : 'No products match your search.'"
                    />
                </template>
            </BaseTable>
        </UCard>

        <div v-if="workspace.filteredSummary.length > summaryPerPage" class="mt-4 flex justify-center">
            <UPagination v-model:page="summaryPage" :total="workspace.filteredSummary.length" :items-per-page="summaryPerPage" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'
import type { ScheduleSummaryItem } from '@/types/Schedule'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
    workspace: ScheduleWorkspace
}>()

const summaryColumns: TableColumn<ScheduleSummaryItem>[] = [
    { accessorKey: 'product_name', header: 'Product' },
    { id: 'default_price', header: 'Price' },
    { accessorKey: 'total_quantity', header: 'Total qty' },
    { id: 'subtotal', header: 'Subtotal' }
]

const summaryPerPage = 15
const summaryPage = ref(1)
const pagedSummary = computed(() => {
    const start = (summaryPage.value - 1) * summaryPerPage
    return props.workspace.filteredSummary.slice(start, start + summaryPerPage)
})

watch(() => props.workspace.filteredSummary, () => {
    summaryPage.value = 1
})
</script>
