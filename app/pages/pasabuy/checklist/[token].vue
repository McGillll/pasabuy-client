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
                <div>
                    <h1 class="text-xl font-semibold text-highlighted">Shopping checklist</h1>
                    <p class="mt-1 text-sm text-muted">Check items off as you buy them. Updates automatically.</p>
                </div>

                <UCard :ui="{ body: 'p-0 sm:p-0' }">
                    <div class="space-y-2 p-2">
                        <ListCard
                            v-for="item in checklistItems"
                            :key="item.product_uuid"
                            :dimmed="item.is_checked"
                        >
                            <template #leading>
                                <UCheckbox
                                    :model-value="item.is_checked"
                                    :disabled="togglingUuid === item.product_uuid"
                                    @update:model-value="(value) => toggleItem(item, !!value)"
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

                        <div v-if="checklistItems.length === 0" class="flex flex-col items-center gap-3 py-10">
                            <UIcon name="i-lucide-list-checks" class="size-8 text-dimmed" />
                            <p class="text-sm text-muted">Nothing on the checklist yet.</p>
                        </div>
                    </div>
                </UCard>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { publicChecklistService } from '@/components/api/public/PublicChecklistService'
import APIError from '@/components/api/user/APIError'
import type { ChecklistItem } from '@/types/Schedule'

definePageMeta({ layout: false })

useHead({ title: 'Checklist' })

const route = useRoute()
const token = route.params.token as string

const checklistItems = ref<ChecklistItem[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const togglingUuid = ref<string | null>(null)

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
    const previousIsChecked = item.is_checked
    const previousCheckedAt = item.checked_at

    item.is_checked = isChecked
    togglingUuid.value = item.product_uuid
    try {
        const response = await publicChecklistService.toggleChecklistItem(token, item.product_uuid, isChecked)
        Object.assign(item, response.data)
    } catch {
        item.is_checked = previousIsChecked
        item.checked_at = previousCheckedAt
    } finally {
        togglingUuid.value = null
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
