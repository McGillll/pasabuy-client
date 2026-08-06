<template>
    <div class="mx-auto max-w-2xl space-y-6">
        <div class="flex items-center justify-end md:justify-between">
            <div class="hidden items-center gap-2 md:flex">
                <IconBasket class="size-5 text-primary" />
                <h1 class="text-xl font-semibold text-highlighted">Blue Basket</h1>
            </div>
            <BaseButton v-if="items.length" size="xs" color="neutral" variant="ghost" :loading="clearing" @click="onClear">
                Clear all
            </BaseButton>
        </div>

        <div v-if="loading" class="space-y-3">
            <USkeleton v-for="n in 3" :key="n" class="h-20 w-full rounded-xl" />
        </div>

        <div v-else-if="items.length === 0" class="flex flex-col items-center gap-3 rounded-xl border border-default bg-elevated/50 px-4 py-12 text-center">
            <IconBasket class="size-8 text-dimmed" />
            <p class="text-sm text-muted">Your basket is empty.</p>
            <BaseButton color="neutral" variant="soft" to="/customer/aisles">
                Browse aisles
            </BaseButton>
        </div>

        <template v-else>
            <div class="divide-y divide-default rounded-xl border border-default bg-elevated/50 px-4">
                <div v-for="item in items" :key="item.uuid" class="flex items-center gap-4 py-3 first:pt-4 last:pb-4">
                    <button
                        type="button"
                        class="flex min-w-0 flex-1 items-center gap-4 text-left"
                        :aria-label="`View ${item.product_name}`"
                        @click="viewItem(item)"
                    >
                        <img
                            v-if="item.product_image_url && !imageLoadFailed[item.uuid]"
                            :src="item.product_image_url"
                            loading="lazy"
                            class="size-12 shrink-0 rounded-lg object-cover"
                            alt=""
                            @error="imageLoadFailed[item.uuid] = true"
                        >
                        <div v-else class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-elevated text-dimmed">
                            <UIcon name="i-lucide-image" class="size-5" />
                        </div>

                        <div class="min-w-0 flex-1">
                            <p class="truncate font-medium text-highlighted">{{ item.product_name }}</p>
                            <p class="font-mono tabular-nums text-sm font-medium text-highlighted">₱{{ item.subtotal.toFixed(2) }}</p>
                        </div>
                    </button>

                    <div class="flex shrink-0 items-center gap-2">
                        <BaseButton
                            icon="i-lucide-minus"
                            size="xs"
                            color="neutral"
                            variant="soft"
                            class="min-h-11 min-w-11"
                            :aria-label="`Decrease quantity for ${item.product_name}`"
                            @click="onDecrement(item)"
                        />
                        <span class="w-6 text-center font-mono tabular-nums font-medium">{{ item.quantity }}</span>
                        <BaseButton
                            icon="i-lucide-plus"
                            size="xs"
                            color="neutral"
                            variant="soft"
                            class="min-h-11 min-w-11"
                            :aria-label="`Increase quantity for ${item.product_name}`"
                            @click="onIncrement(item)"
                        />
                        <BaseButton
                            icon="i-lucide-trash-2"
                            size="xs"
                            color="error"
                            variant="ghost"
                            class="min-h-11 min-w-11"
                            :aria-label="`Remove ${item.product_name} from basket`"
                            @click="onRemove(item)"
                        />
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between rounded-xl border border-default bg-elevated/50 px-4 py-3">
                <p class="text-sm text-muted">{{ totalItems }} item{{ totalItems === 1 ? '' : 's' }}</p>
                <p class="font-mono tabular-nums text-lg font-semibold text-highlighted">₱{{ totalAmount.toFixed(2) }}</p>
            </div>

            <div class="space-y-3">
                <h2 class="text-sm font-medium text-highlighted">Send to a pasabuy</h2>

                <div v-if="schedulesLoading" class="space-y-2">
                    <USkeleton class="h-16 w-full rounded-xl" />
                    <USkeleton class="h-16 w-full rounded-xl" />
                </div>

                <div v-else-if="openSchedules.length === 0" class="flex flex-col items-center gap-2 rounded-xl border border-default bg-elevated/50 px-4 py-6 text-center">
                    <IconPasabuys class="size-6 text-dimmed" />
                    <p class="text-sm text-muted">No pasabuys are open right now.</p>
                    <BaseButton size="sm" color="neutral" variant="soft" to="/customer/pasabuys">
                        Browse pasabuys
                    </BaseButton>
                </div>

                <template v-else>
                    <NuxtLink
                        v-for="schedule in openSchedules"
                        :key="schedule.uuid"
                        :to="`/pasabuy/${schedule.uuid}?basket=1`"
                        class="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-default bg-elevated/50 px-4 py-3 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <div class="min-w-0">
                            <p class="truncate font-medium text-highlighted">{{ schedule.title }}</p>
                            <p v-if="schedule.seller_name" class="truncate text-sm text-muted">{{ schedule.seller_name }}</p>
                        </div>
                        <div class="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">
                            Choose
                            <UIcon name="i-lucide-chevron-right" class="size-4" />
                        </div>
                    </NuxtLink>
                </template>
            </div>
        </template>

        <BaseModal
            :open="isViewOpen"
            :title="viewedItem?.product_name"
            view-only
            @update:open="isViewOpen = $event"
        >
            <div v-if="viewedItem" class="space-y-4">
                <img
                    v-if="viewedItem.product_image_url && !imageLoadFailed[viewedItem.uuid]"
                    :src="viewedItem.product_image_url"
                    class="max-h-64 w-full rounded-lg bg-elevated object-contain"
                    :alt="viewedItem.product_name"
                    @error="imageLoadFailed[viewedItem.uuid] = true"
                >
                <div v-else class="flex h-40 items-center justify-center rounded-lg bg-elevated text-dimmed">
                    <UIcon name="i-lucide-image-off" class="size-8" />
                </div>

                <p class="font-mono tabular-nums text-lg font-semibold text-highlighted">
                    ₱{{ viewedItem.price }} <span class="text-xs font-normal text-dimmed">each</span>
                </p>

                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                        <BaseButton
                            icon="i-lucide-minus"
                            size="xs"
                            color="neutral"
                            variant="soft"
                            class="min-h-11 min-w-11"
                            :aria-label="`Decrease quantity for ${viewedItem.product_name}`"
                            @click="onDecrement(viewedItem)"
                        />
                        <span class="w-6 text-center font-mono tabular-nums font-medium">{{ viewedItem.quantity }}</span>
                        <BaseButton
                            icon="i-lucide-plus"
                            size="xs"
                            color="neutral"
                            variant="soft"
                            class="min-h-11 min-w-11"
                            :aria-label="`Increase quantity for ${viewedItem.product_name}`"
                            @click="onIncrement(viewedItem)"
                        />
                    </div>
                    <p class="font-mono tabular-nums text-lg font-semibold text-highlighted">₱{{ viewedItem.subtotal.toFixed(2) }}</p>
                </div>
            </div>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { customerPasabuyScheduleService } from '@/components/api/customer/CustomerPasabuyScheduleService'
import type { BasketItem } from '@/types/Basket'
import type { ScheduleBrowseItem } from '@/types/Schedule'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })
useHead({ title: 'Blue Basket' })

const { basket, load: loadBasket, updateQuantity, remove, clear } = useBasket()

const loading = ref(!basket.value)
const clearing = ref(false)
const imageLoadFailed = ref<Record<string, boolean>>({})

const items = computed(() => basket.value?.items ?? [])
const totalItems = computed(() => basket.value?.total_items ?? 0)
const totalAmount = computed(() => basket.value?.total_amount ?? 0)

const isViewOpen = ref(false)
const viewedItemUuid = ref<string | null>(null)
const viewedItem = computed(() => items.value.find(item => item.uuid === viewedItemUuid.value) ?? null)

function viewItem(item: BasketItem) {
    viewedItemUuid.value = item.uuid
    isViewOpen.value = true
}

watch(viewedItem, (item) => {
    if (!item) isViewOpen.value = false
})

async function onIncrement(item: BasketItem) {
    await updateQuantity(item.uuid, item.quantity + 1)
}

async function onDecrement(item: BasketItem) {
    if (item.quantity <= 1) {
        await remove(item.uuid)
        return
    }
    await updateQuantity(item.uuid, item.quantity - 1)
}

async function onRemove(item: BasketItem) {
    await remove(item.uuid)
}

async function onClear() {
    clearing.value = true
    await clear()
    clearing.value = false
}

const openSchedules = ref<ScheduleBrowseItem[]>([])
const schedulesLoading = ref(true)

async function loadOpenSchedules() {
    schedulesLoading.value = true
    try {
        const response = await customerPasabuyScheduleService.fetchOpenSchedules({ per_page: 5 })
        openSchedules.value = response.data.items
    } catch {
        openSchedules.value = []
    } finally {
        schedulesLoading.value = false
    }
}

onMounted(async () => {
    loading.value = true
    await loadBasket()
    loading.value = false
    await loadOpenSchedules()
})

onPullToRefresh(async () => {
    await loadBasket()
    await loadOpenSchedules()
})
</script>
