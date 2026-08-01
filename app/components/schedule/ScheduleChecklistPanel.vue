<template>
    <UCard class="mt-4" :ui="{ body: 'p-0 sm:p-0' }">
        <template #header>
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <BaseProgressRing size="sm" :value="workspace.checklistCheckedCount" :max="workspace.checklistTotalCount" />
                    <span class="text-sm text-muted">{{ workspace.checklistCheckedCount }} of {{ workspace.checklistTotalCount }} picked up</span>
                </div>
                <UFieldGroup>
                    <BaseButton
                        icon="i-lucide-user-plus"
                        color="neutral"
                        variant="soft"
                        size="sm"
                        :loading="workspace.loadingChecklistShareLink"
                        :disabled="!workspace.isLocked"
                        @click="workspace.copyChecklistShareLink"
                    >
                        Share
                    </BaseButton>
                    <UDropdownMenu :items="secondaryChecklistActions" :content="{ align: 'end' }">
                        <BaseButton
                            icon="i-lucide-chevron-down"
                            color="neutral"
                            variant="soft"
                            size="sm"
                            :disabled="!workspace.isLocked"
                            aria-label="More checklist actions"
                        />
                    </UDropdownMenu>
                </UFieldGroup>
            </div>
        </template>

        <div v-if="workspace.checklistCategoryOptions.length > 2" class="border-b border-default px-4 py-3">
            <ChipOverflowFilter
                v-model="workspace.checklistCategoryFilter"
                :items="workspace.checklistCategoryOptions"
                :visible-count="6"
                title="All categories"
                search-placeholder="Search categories…"
            />
        </div>

        <BaseTable
            :data="workspace.filteredChecklistItems"
            :columns="checklistColumns"
            :loading="workspace.checklistLoading"
            :ui="{ tr: 'hover:bg-elevated/50 transition-colors cursor-pointer' }"
            @select="(_event: Event, row: { original: ChecklistItem }) => onRowClick(row.original)"
        >
            <template #is_checked-cell="{ row }">
                <BaseCheckbox
                    :model-value="row.original.is_checked"
                    :disabled="!row.original.product_uuid || workspace.togglingUuid === row.original.product_uuid"
                />
            </template>
            <template #product-cell="{ row }">
                <p class="font-medium text-highlighted" :class="{ 'line-through text-muted': row.original.is_checked }">{{ row.original.product_name }}</p>
                <p class="text-sm text-muted">{{ row.original.category_name ?? '-' }}</p>
            </template>
            <template #quantity-cell="{ row }">
                <span class="text-lg font-bold tabular-nums" :class="row.original.is_checked ? 'text-muted' : 'text-highlighted'">{{ row.original.quantity }}x</span>
            </template>
            <template #adjustment-cell="{ row }">
                <UBadge v-if="row.original.additional_quantity > 0" color="warning" variant="subtle" size="sm">
                    +{{ row.original.additional_quantity }} more
                </UBadge>
                <UBadge v-if="row.original.return_quantity > 0" color="error" variant="subtle" size="sm">
                    return {{ row.original.return_quantity }}
                </UBadge>
            </template>
            <template #list-item="{ item }">
                <ListCard
                    :clickable="!!item.product_uuid && workspace.togglingUuid !== item.product_uuid"
                    :chevron="false"
                    @click="onRowClick(item)"
                >
                    <template #leading>
                        <BaseCheckbox
                            :model-value="item.is_checked"
                            :disabled="!item.product_uuid || workspace.togglingUuid === item.product_uuid"
                            class="pointer-events-none"
                        />
                    </template>
                    <template #title>
                        <div class="flex w-full items-center justify-between gap-2">
                            <p class="font-medium text-highlighted" :class="{ 'line-through text-muted': item.is_checked }">{{ item.product_name }}</p>
                            <p class="shrink-0 text-xl font-bold tabular-nums" :class="item.is_checked ? 'text-muted' : 'text-highlighted'">{{ item.quantity }}x</p>
                        </div>
                    </template>
                    <template #subtitle>
                        {{ item.category_name ?? '-' }}
                    </template>
                    <template v-if="item.additional_quantity > 0 || item.return_quantity > 0" #status>
                        <UBadge v-if="item.additional_quantity > 0" color="warning" variant="subtle" size="sm">
                            +{{ item.additional_quantity }} more
                        </UBadge>
                        <UBadge v-if="item.return_quantity > 0" color="error" variant="subtle" size="sm">
                            return {{ item.return_quantity }}
                        </UBadge>
                    </template>
                </ListCard>
            </template>
            <template #empty>
                <BaseEmptyState
                    v-if="workspace.checklistItems.length === 0"
                    icon="i-lucide-list-checks"
                    message="Close the schedule to generate the shopping checklist."
                />
                <BaseEmptyState
                    v-else
                    icon="i-lucide-list-checks"
                    message="No items in this category."
                />
            </template>
        </BaseTable>
    </UCard>

    <BaseModal
        v-model:open="isConfirmSheetOpen"
        :title="confirmTarget?.product_name"
        description="Confirm price & stock before checking off"
    >
        <div class="space-y-4">
            <BaseFormField label="Actual price">
                <BaseInput
                    v-model.number="confirmForm.actual_price"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    :disabled="confirmForm.product_status === 'out_of_stock'"
                >
                    <template #leading>
                        <span class="text-sm text-dimmed">₱</span>
                    </template>
                </BaseInput>
            </BaseFormField>

            <div class="grid grid-cols-3 gap-2">
                <button
                    v-for="option in productStatusOptions"
                    :key="option.value"
                    type="button"
                    class="flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-xs font-semibold ring-1 transition-colors"
                    :class="confirmForm.product_status === option.value ? statusActiveClass[option.value] : 'text-muted ring-default'"
                    @click="confirmForm.product_status = option.value"
                >
                    {{ option.label }}
                </button>
            </div>
        </div>
        <template #footer>
            <BaseButton block :loading="confirming" @click="onConfirmSheet">Confirm &amp; check off</BaseButton>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'
import type { ChecklistItem } from '@/types/Schedule'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

const props = defineProps<{
    workspace: ScheduleWorkspace
}>()

const secondaryChecklistActions = computed<DropdownMenuItem[]>(() => [
    {
        label: 'Regenerate checklist',
        icon: 'i-lucide-refresh-cw',
        loading: props.workspace.regeneratingChecklist,
        onSelect: () => props.workspace.regenerateChecklist()
    },
    {
        label: 'Revoke helper link',
        icon: 'i-lucide-shield-off',
        color: 'error',
        loading: props.workspace.regeneratingChecklistShareLink,
        onSelect: () => props.workspace.regenerateChecklistShareLinkAction()
    }
])

const checklistColumns: TableColumn<ChecklistItem>[] = [
    { id: 'is_checked', header: '' },
    { id: 'product', header: 'Product' },
    { accessorKey: 'quantity', header: 'Qty' },
    { id: 'adjustment', header: '' }
]

const productStatusOptions = [
    { label: 'Normal', value: 'none' as const },
    { label: 'B1T1', value: 'b1t1' as const },
    { label: 'Out of stock', value: 'out_of_stock' as const }
]

const statusActiveClass: Record<string, string> = {
    none: 'bg-success/10 text-success ring-success',
    b1t1: 'bg-warning/10 text-warning ring-warning',
    out_of_stock: 'bg-error/10 text-error ring-error'
}

const isConfirmSheetOpen = ref(false)
const confirmTarget = ref<ChecklistItem | null>(null)
const confirming = ref(false)
const confirmForm = reactive({
    actual_price: null as number | null,
    product_status: 'none' as 'none' | 'b1t1' | 'out_of_stock'
})

function onRowClick(item: ChecklistItem) {
    if (!item.product_uuid || props.workspace.togglingUuid === item.product_uuid) return
    onCheckboxChange(item, !item.is_checked)
}

function onCheckboxChange(item: ChecklistItem, isChecked: boolean) {
    if (!isChecked) {
        props.workspace.toggleChecklist(item, false)
        return
    }

    confirmTarget.value = item
    confirmForm.actual_price = item.product_uuid ? props.workspace.getScheduleProductPrice(item.product_uuid) : null
    confirmForm.product_status = (item.product_uuid ? props.workspace.getScheduleProductStatus(item.product_uuid) : undefined) ?? 'none'
    isConfirmSheetOpen.value = true
}

async function onConfirmSheet() {
    if (!confirmTarget.value) return

    confirming.value = true
    try {
        const succeeded = await props.workspace.confirmChecklistItemPrice(confirmTarget.value, {
            actual_price: confirmForm.product_status === 'out_of_stock' ? undefined : (confirmForm.actual_price ?? undefined),
            product_status: confirmForm.product_status
        })
        if (succeeded) isConfirmSheetOpen.value = false
    } finally {
        confirming.value = false
    }
}

// This panel is unmounted (Nuxt UI Tabs' default `unmountOnHide`) whenever the user
// leaves the Checklist sub-tab, so mount/unmount doubles as the live-sync on/off signal.
watch(() => props.workspace.isLocked, (locked) => {
    if (locked) props.workspace.startChecklistLiveSync()
    else props.workspace.stopChecklistLiveSync()
}, { immediate: true })

onUnmounted(() => props.workspace.stopChecklistLiveSync())
</script>
