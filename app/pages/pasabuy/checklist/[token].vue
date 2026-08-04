<template>
    <div class="min-h-screen bg-default px-4 py-8">
        <div class="mx-auto max-w-2xl space-y-6">
            <Transition
                enter-active-class="transition-opacity duration-300"
                leave-active-class="transition-opacity duration-300"
                enter-from-class="opacity-0"
                leave-to-class="opacity-0"
            >
                <SplashScreen v-if="loading" />
            </Transition>

            <UAlert
                v-if="!loading && errorMessage"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                title="Can't open this checklist"
                :description="errorMessage"
            />

            <template v-else>
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                        <h1 class="text-lg font-semibold leading-tight text-highlighted">Shopping checklist</h1>
                        <p class="mt-1 text-sm text-muted">{{ checkedCount }} of {{ totalCount }} picked up</p>
                    </div>
                    <BaseProgressRing :value="checkedCount" :max="totalCount" class="mt-0.5 shrink-0" />
                </div>

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <div v-if="categoryOptions.length > 2" class="border-b border-default px-4 py-3">
                        <ChipOverflowFilter
                            v-model="categoryFilter"
                            :items="categoryOptions"
                            :visible-count="6"
                            title="All categories"
                            search-placeholder="Search categories…"
                        />
                    </div>

                    <div class="space-y-2 p-2">
                        <ListCard
                            v-for="(item, index) in filteredChecklistItems"
                            :key="item.product_uuid ?? index"
                            :dimmed="item.is_checked"
                            :clickable="!!item.product_uuid && togglingUuid !== item.product_uuid"
                            :chevron="false"
                            @click="onRowClick(item)"
                        >
                            <template #leading>
                                <BaseCheckbox
                                    :model-value="item.is_checked"
                                    :disabled="!item.product_uuid || togglingUuid === item.product_uuid"
                                    class="pointer-events-none"
                                />
                            </template>
                            <template #title>
                                <div class="flex w-full items-center gap-2">
                                    <p class="min-w-0 flex-1 truncate font-medium text-highlighted" :class="{ 'line-through text-muted': item.is_checked }">{{ item.product_name }}</p>
                                    <UBadge v-if="item.category_name" color="neutral" variant="subtle" size="sm" class="shrink-0">
                                        {{ item.category_name }}
                                    </UBadge>
                                    <p class="shrink-0 font-mono text-lg font-bold tabular-nums" :class="item.is_checked ? 'text-muted' : 'text-highlighted'">{{ item.quantity }}x</p>
                                </div>
                            </template>
                            <template v-if="item.additional_quantity > 0 || item.return_quantity > 0" #status>
                                <UBadge v-if="item.additional_quantity > 0" color="warning" variant="subtle" size="sm">
                                    <span class="font-mono tabular-nums">+{{ item.additional_quantity }}</span> more
                                </UBadge>
                                <UBadge v-if="item.return_quantity > 0" color="error" variant="subtle" size="sm">
                                    <span class="font-mono tabular-nums">-{{ item.return_quantity }}</span> to return
                                </UBadge>
                            </template>
                        </ListCard>

                        <div v-if="checklistItems.length === 0" class="flex flex-col items-center gap-3 py-10">
                            <UIcon name="i-lucide-list-checks" class="size-8 text-dimmed" />
                            <p class="text-sm text-muted">Nothing on the checklist yet.</p>
                        </div>
                        <div v-else-if="filteredChecklistItems.length === 0" class="flex flex-col items-center gap-3 py-10">
                            <UIcon name="i-lucide-list-checks" class="size-8 text-dimmed" />
                            <p class="text-sm text-muted">No items in this category.</p>
                        </div>
                    </div>
                </UCard>
            </template>
        </div>

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

                <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Product status" @keydown="onStatusRadioKeydown">
                    <button
                        v-for="option in productStatusOptions"
                        :key="option.value"
                        type="button"
                        role="radio"
                        :aria-checked="confirmForm.product_status === option.value"
                        :tabindex="confirmForm.product_status === option.value ? 0 : -1"
                        class="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2.5 text-xs font-semibold ring-2 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
    </div>
</template>

<script setup lang="ts">
import { publicChecklistService } from '@/components/api/public/PublicChecklistService'
import APIError from '@/components/api/user/APIError'
import type { ChecklistItem } from '@/types/Schedule'

definePageMeta({ layout: false })

useHead({ title: 'Checklist' })

const toast = useToast()

const route = useRoute()
const token = route.params.token as string

const checklistItems = ref<ChecklistItem[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const togglingUuid = ref<string | null>(null)
const categoryFilter = ref('all')

const productStatusOptions = [
    { label: 'Normal', value: 'none' as const },
    { label: 'B1T1', value: 'b1t1' as const },
    { label: 'Out of stock', value: 'out_of_stock' as const }
]

const statusActiveClass: Record<string, string> = {
    none: 'bg-elevated text-highlighted ring-muted',
    b1t1: 'bg-success/10 text-success ring-success',
    out_of_stock: 'bg-error/10 text-error ring-error'
}

function onStatusRadioKeydown(event: KeyboardEvent) {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()

    const currentIndex = productStatusOptions.findIndex((option) => option.value === confirmForm.product_status)
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + direction + productStatusOptions.length) % productStatusOptions.length
    confirmForm.product_status = productStatusOptions[nextIndex]!.value

    const group = event.currentTarget as HTMLElement
    const buttons = group.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    buttons[nextIndex]?.focus()
}

const isConfirmSheetOpen = ref(false)
const confirmTarget = ref<ChecklistItem | null>(null)
const confirming = ref(false)
const confirmForm = reactive({
    actual_price: null as number | null,
    product_status: 'none' as 'none' | 'b1t1' | 'out_of_stock'
})

const categoryOptions = computed(() => {
    const seen = new Map<string, string>()
    for (const item of checklistItems.value) {
        const name = item.category_name ?? 'Uncategorized'
        seen.set(name, name)
    }
    return [{ label: 'All', value: 'all' }, ...[...seen.values()].sort().map((name) => ({ label: name, value: name }))]
})

const filteredChecklistItems = computed(() => {
    return checklistItems.value.filter((item) => {
        if (categoryFilter.value !== 'all' && (item.category_name ?? 'Uncategorized') !== categoryFilter.value) return false
        return true
    })
})

const checkedCount = computed(() => checklistItems.value.filter((item) => item.is_checked).length)
const totalCount = computed(() => checklistItems.value.length)

async function load() {
    try {
        const response = await publicChecklistService.fetchChecklist(token)
        checklistItems.value = response.data
        errorMessage.value = null
    } catch (error) {
        errorMessage.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        loading.value = false
    }
}

async function toggleItem(item: ChecklistItem, isChecked: boolean) {
    if (!item.product_uuid) return

    const previousIsChecked = item.is_checked
    const previousCheckedAt = item.checked_at

    item.is_checked = isChecked
    togglingUuid.value = item.product_uuid
    try {
        const response = await publicChecklistService.toggleChecklistItem(token, item.product_uuid, isChecked)
        Object.assign(item, response.data)
    } catch (error) {
        item.is_checked = previousIsChecked
        item.checked_at = previousCheckedAt
        toast.add({ title: 'Update failed', description: error instanceof APIError ? error.message : 'Something went wrong.', color: 'error' })
    } finally {
        togglingUuid.value = null
    }
}

function onRowClick(item: ChecklistItem) {
    if (!item.product_uuid || togglingUuid.value === item.product_uuid) return

    if (item.is_checked) {
        toggleItem(item, false)
        return
    }

    confirmTarget.value = item
    confirmForm.actual_price = item.actual_price ?? item.default_price ?? null
    confirmForm.product_status = item.product_status ?? 'none'
    isConfirmSheetOpen.value = true
}

async function onConfirmSheet() {
    const target = confirmTarget.value
    if (!target?.product_uuid) return

    confirming.value = true
    try {
        const response = await publicChecklistService.confirmPrice(token, target.product_uuid, {
            actual_price: confirmForm.product_status === 'out_of_stock' ? undefined : (confirmForm.actual_price ?? undefined),
            product_status: confirmForm.product_status
        })
        const item = checklistItems.value.find((candidate) => candidate.product_uuid === target.product_uuid)
        if (item) Object.assign(item, response.data.checklist_item)
        toast.add({ title: 'Checked off', description: 'Price and stock confirmed.', color: 'success' })
        isConfirmSheetOpen.value = false
    } catch (error) {
        toast.add({ title: 'Confirm failed', description: error instanceof APIError ? error.message : 'Something went wrong.', color: 'error' })
    } finally {
        confirming.value = false
    }
}

function applyBroadcastUpdate(updatedItem: ChecklistItem) {
    const item = checklistItems.value.find((candidate) => candidate.product_uuid === updatedItem.product_uuid)
    if (item) {
        Object.assign(item, updatedItem)
    }
}

function applyBroadcastRegenerated(payload: { items: ChecklistItem[] }) {
    checklistItems.value = payload.items
}

const { $echo } = useNuxtApp()
let channel: ReturnType<typeof $echo.channel> | null = null

onMounted(async () => {
    await load()
    channel = $echo.channel(`checklist.${token}`)
    channel.listen('.checklist.item.toggled', applyBroadcastUpdate)
    channel.listen('.checklist.regenerated', applyBroadcastRegenerated)
})

onPullToRefresh(load)

onUnmounted(() => {
    if (channel) $echo.leaveChannel(`checklist.${token}`)
})
</script>
