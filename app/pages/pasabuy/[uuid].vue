<template>
    <div class="min-h-screen bg-default px-4 py-8" :class="{ 'pb-32 lg:pb-8': showBottomBar }">
        <div class="mx-auto max-w-2xl space-y-6 lg:max-w-5xl lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8 lg:space-y-0">
        <div class="min-w-0 space-y-6">
            <Transition
                enter-active-class="transition-opacity duration-300"
                leave-active-class="transition-opacity duration-300"
                enter-from-class="opacity-0"
                leave-to-class="opacity-0"
            >
                <SplashScreen v-if="loading" />
            </Transition>

            <UAlert v-if="!loading && notFound" color="error" variant="subtle" title="Pasabuy not found" description="This link doesn't point to a valid pasabuy." />

            <template v-else-if="schedule">
                <BaseButton
                    v-if="isLoggedIn"
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-arrow-left"
                    to="/customer/pasabuys"
                    class="-ml-2"
                >
                    Browse Pasabuys
                </BaseButton>

                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0">
                        <h1 class="text-2xl font-semibold text-highlighted">{{ schedule.title }}</h1>
                        <p v-if="schedule.description" class="mt-1 text-muted">{{ schedule.description }}</p>
                        <div v-if="schedule.pasabuy_schedule_date" class="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
                            <span class="inline-flex items-center gap-1.5">
                                <UIcon name="i-lucide-alarm-clock" class="size-4 text-dimmed" />
                                Close by {{ formatDate(schedule.pasabuy_schedule_date) }}
                            </span>
                        </div>
                    </div>
                    <BaseButton v-if="isLoggedIn" size="sm" color="neutral" variant="soft" to="/customer/orders" class="self-start">
                        <template #leading>
                            <IconOrders class="size-5" />
                        </template>
                        My Orders
                    </BaseButton>
                </div>

                <UAlert
                    v-if="!schedule.is_open"
                    color="warning"
                    variant="subtle"
                    title="This pasabuy is closed"
                    description="Ordering is no longer available for this pasabuy."
                />

                <UAlert
                    v-else-if="!isLoggedIn && !pricingNoteDismissed"
                    color="info"
                    variant="subtle"
                    icon="i-lucide-info"
                    title="Browsing as a guest"
                    description="You can browse freely, log in to place an order. One note: 'estimated' prices may still change until the seller confirms them, and 'B1T1' means Buy 1, Take 1."
                    :close="true"
                    @update:open="dismissPricingNote"
                />

                <UAlert
                    v-else-if="!isLoggedIn"
                    color="info"
                    variant="subtle"
                    icon="i-lucide-info"
                    title="Browsing as a guest"
                    description="You can browse freely. You'll need to log in to place an order."
                />

                <UAlert
                    v-else-if="!pricingNoteDismissed"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-badge-info"
                    title="A note on pricing"
                    description="'Estimated' prices may still change until the seller confirms them. 'B1T1' means Buy 1, Take 1."
                    :close="true"
                    @update:open="dismissPricingNote"
                />

                <UCard v-if="myOrder && !editingOrder">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="font-medium">Your order</h2>
                            <OrderStatusBadge :status="myOrder.status" />
                        </div>
                    </template>

                    <div class="divide-y divide-default">
                        <div v-for="item in myOrder.items" :key="item.uuid" class="py-3 first:pt-0 last:pb-0">
                            <OrderLineItem :item="item" />
                        </div>
                    </div>

                    <template #footer>
                        <div class="flex items-center justify-between gap-3">
                            <p class="font-semibold text-highlighted">Total: <span class="font-mono tabular-nums">₱{{ Number(myOrder.total_amount).toFixed(2) }}</span></p>
                            <div class="flex items-center gap-2">
                                <BaseButton v-if="myOrder.is_editable" variant="soft" icon="i-lucide-pencil" @click="startEditOrder">
                                    Edit order
                                </BaseButton>
                                <CancelOrderControl
                                    v-if="myOrder.is_cancellable"
                                    :loading="cancellingOrder"
                                    :order-title="schedule?.title"
                                    :order-total="myOrder.total_amount"
                                    @confirm="cancelOrder"
                                />
                                <p v-if="!myOrder.is_editable && !myOrder.is_cancellable" class="text-sm text-muted">
                                    This order can no longer be edited.
                                </p>
                            </div>
                        </div>
                    </template>
                </UCard>

                <template v-if="!myOrder || editingOrder">
                    <div class="sticky top-0 z-10 -mx-4 space-y-2 bg-default/95 px-4 py-2 backdrop-blur-sm">
                        <div class="flex items-center gap-2">
                            <BaseSearchInput
                                v-model="productSearch"
                                :items="searchSuggestionItems"
                                :loading="suggestionsLoading"
                                placeholder="Search items…"
                                class="flex-1"
                                @select="onSearchSuggestionSelect"
                            >
                                <template #item-leading="{ item }">
                                    <img
                                        v-if="(item as ProductSuggestionItem).product.image_url"
                                        :src="(item as ProductSuggestionItem).product.image_url!"
                                        class="size-8 rounded-lg object-cover"
                                        alt=""
                                    >
                                    <div v-else class="flex size-8 items-center justify-center rounded-lg bg-elevated text-dimmed">
                                        <UIcon name="i-lucide-image" class="size-4" />
                                    </div>
                                </template>
                                <template #item-trailing="{ item }">
                                    <UBadge
                                        v-if="resolvedStatus((item as ProductSuggestionItem).product) === 'b1t1'"
                                        color="success"
                                        variant="subtle"
                                        size="sm"
                                    >
                                        B1T1
                                    </UBadge>
                                    <UBadge
                                        v-else-if="resolvedStatus((item as ProductSuggestionItem).product) === 'out_of_stock'"
                                        color="error"
                                        variant="subtle"
                                        size="sm"
                                    >
                                        Out of stock
                                    </UBadge>
                                </template>
                                <template #empty="{ searchTerm: term }">
                                    <div v-if="suggestionsLoading" class="py-1 text-sm text-muted">
                                        Searching…
                                    </div>
                                    <template v-else>
                                        {{ term ? `No items match "${term}"` : 'No matching items' }}
                                    </template>
                                </template>
                            </BaseSearchInput>
                            <BaseButton
                                v-if="showFilters"
                                class="sm:hidden shrink-0"
                                color="neutral"
                                variant="outline"
                                icon="i-lucide-list-filter"
                                @click="isFiltersOpen = true"
                            >
                                Filters
                                <UBadge v-if="activeFilterCount" color="neutral" variant="subtle" size="sm">{{ activeFilterCount }}</UBadge>
                            </BaseButton>
                        </div>
                        <div v-if="showFilters" class="hidden sm:grid grid-cols-4 gap-2">
                            <BaseSelect
                                v-model="filters.applied.status"
                                :items="statusFilterOptions"
                                value-key="value"
                                placeholder="Status"
                            />
                            <BaseSelect
                                v-model="filters.applied.sortByPrice"
                                :items="sortByPriceOptions"
                                value-key="value"
                                placeholder="Sort by price"
                            />
                            <BaseInput
                                v-model.number="filters.applied.priceMin"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Min price"
                            />
                            <BaseInput
                                v-model.number="filters.applied.priceMax"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Max price"
                            />
                        </div>

                        <USlideover v-model:open="isFiltersOpen" side="bottom" title="Filters">
                            <template #body>
                                <div class="space-y-4">
                                    <BaseFormField label="Status">
                                        <BaseSelect v-model="filters.draft.status" :items="statusFilterOptions" value-key="value" />
                                    </BaseFormField>
                                    <BaseFormField label="Sort by price">
                                        <BaseSelect v-model="filters.draft.sortByPrice" :items="sortByPriceOptions" value-key="value" />
                                    </BaseFormField>
                                    <div class="grid grid-cols-2 gap-4">
                                        <BaseFormField label="Min price">
                                            <BaseInput v-model.number="filters.draft.priceMin" type="number" min="0" step="0.01" placeholder="0.00" />
                                        </BaseFormField>
                                        <BaseFormField label="Max price">
                                            <BaseInput v-model.number="filters.draft.priceMax" type="number" min="0" step="0.01" placeholder="0.00" />
                                        </BaseFormField>
                                    </div>
                                </div>
                            </template>
                            <template #footer>
                                <div class="w-full flex items-center gap-2">
                                    <BaseButton class="flex-1" color="neutral" variant="outline" @click="clearDraftFilters">Clear filters</BaseButton>
                                    <BaseButton class="flex-1" @click="applyDraftFilters">Show {{ draftFilteredCount }} Result{{ draftFilteredCount === 1 ? '' : 's' }}</BaseButton>
                                </div>
                            </template>
                        </USlideover>
                    </div>

                    <div v-if="editingOrder" class="flex justify-end">
                        <BaseButton size="xs" color="neutral" variant="ghost" @click="cancelEditOrder">
                            Cancel editing
                        </BaseButton>
                    </div>

                    <div>
                        <BaseButton v-if="currentCategoryUuid" size="sm" color="neutral" variant="ghost" icon="i-lucide-arrow-left" class="-ml-2" @click="goBackCategory">
                            Back
                        </BaseButton>

                        <div v-if="!categoryTreeNotFound" class="flex items-center gap-2">
                            <IconAisles class="size-5 text-dimmed" />
                            <h2 class="text-lg font-semibold text-highlighted">{{ currentCategory?.name ?? 'Browse by category' }}</h2>
                        </div>
                    </div>

                    <div v-if="loadingCategoryTree" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        <div v-for="n in 8" :key="n" class="space-y-2">
                            <USkeleton class="aspect-square w-full rounded-xl" />
                            <USkeleton class="h-3 w-3/4" />
                        </div>
                    </div>

                    <UAlert
                        v-else-if="categoryTreeNotFound"
                        color="error"
                        variant="subtle"
                        title="Category not found"
                        description="This category doesn't exist or is no longer available."
                    />

                    <UAlert
                        v-else-if="categoryTreeError"
                        color="error"
                        variant="subtle"
                        title="Failed to load"
                        :description="categoryTreeError"
                    >
                        <template #actions>
                            <BaseButton size="xs" color="error" variant="soft" @click="loadCategoryLevel">
                                Retry
                            </BaseButton>
                        </template>
                    </UAlert>

                    <template v-else-if="isLeafCategory">
                        <div v-if="visibleProducts.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            <PasabuyItemCard
                                v-for="product in visibleProducts"
                                :key="product.uuid"
                                :product="product"
                                :name="displayName(product)"
                                :price="resolvedPrice(product)"
                                :confirmed="isPriceConfirmed(product)"
                                :status="resolvedStatus(product)"
                                :quantity="quantities[product.uuid] || 0"
                                @select="openQuickAdd(product)"
                            />
                        </div>
                        <div v-else class="flex flex-col items-center gap-3 py-10">
                            <UIcon name="i-lucide-package-search" class="size-8 text-dimmed" />
                            <p class="text-sm text-muted">No items in this aisle yet. Check back soon.</p>
                        </div>

                        <div v-if="filteredProducts.length > 0" class="flex flex-col items-center gap-3 pt-2">
                            <p class="text-sm text-muted">Showing {{ visibleProducts.length }} of {{ filteredProducts.length }} items</p>
                            <BaseButton v-if="hasMoreProducts" color="neutral" variant="outline" @click="loadMoreProducts">
                                Load more
                            </BaseButton>
                        </div>
                    </template>

                    <template v-else-if="branchChildren.length || leafChildren.length">
                        <div v-if="branchChildren.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <CategoryTile
                                v-for="(child, index) in branchChildren"
                                :key="child.uuid"
                                :category="child"
                                :wide="isOddLastBranchTile(index)"
                                :class="{ 'col-span-2': isOddLastBranchTile(index) }"
                                @select="drillInto(child.uuid)"
                            />
                        </div>

                        <PasabuyCategoryShelf
                            v-for="child in leafChildren"
                            :key="child.uuid"
                            :category="child"
                            :items="shelfItemsFor(child.uuid)"
                            @select="openQuickAdd"
                            @view-all="drillInto(child.uuid)"
                        />
                    </template>

                    <div v-else class="flex flex-col items-center gap-3 py-10">
                        <IconAisles class="size-8 text-dimmed" />
                        <p class="text-sm text-muted">No aisles to browse right now. Check back soon.</p>
                    </div>
                </template>

            </template>
        </div>

        <aside v-if="showBottomBar" class="hidden lg:sticky lg:top-8 lg:block">
            <UCard>
                <template #header>
                    <h2 class="font-medium">Order summary</h2>
                </template>

                <template v-if="!isLoggedIn">
                    <p class="text-sm text-muted">Log in to place an order.</p>
                    <div class="mt-3 flex gap-2">
                        <BaseButton color="neutral" variant="soft" :to="`/register?redirect=${encodeURIComponent(route.fullPath)}`">
                            Sign up
                        </BaseButton>
                        <BaseButton :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`">
                            Log in
                        </BaseButton>
                    </div>
                </template>

                <template v-else-if="!isApproved">
                    <UAlert
                        color="info"
                        variant="subtle"
                        icon="i-lucide-clock"
                        title="Waiting on admin approval"
                        description="You'll be able to order as soon as the seller approves your account. Feel free to keep browsing in the meantime."
                    />
                </template>

                <template v-else-if="isBlockedByReceivable">
                    <UAlert
                        color="warning"
                        variant="subtle"
                        icon="i-lucide-circle-alert"
                        title="Settle your balance to order"
                        :description="`You have ₱${receivable.toFixed(2)} in unpaid orders. Settle it before placing a new one.`"
                    >
                        <template #actions>
                            <BaseButton size="xs" color="warning" variant="solid" to="/customer/orders">
                                View my orders
                            </BaseButton>
                        </template>
                    </UAlert>
                </template>

                <template v-else>
                    <UAlert v-if="submitError" color="error" variant="subtle" :title="submitError" class="mb-3" />
                    <p class="text-xs text-muted">{{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}</p>
                    <p class="font-mono tabular-nums text-2xl font-semibold text-highlighted">₱{{ total.toFixed(2) }}</p>
                    <BaseButton
                        block
                        class="mt-3"
                        color="neutral"
                        variant="soft"
                        :disabled="!hasItems"
                        @click="isCartOpen = true"
                    >
                        <template #leading>
                            <IconBasket class="size-5" />
                        </template>
                        View basket
                    </BaseButton>
                    <BaseButton
                        block
                        class="mt-2"
                        size="lg"
                        :loading="submitting"
                        :disabled="!schedule?.is_open || !hasItems"
                        @click="submitOrder"
                    >
                        {{ editingOrder ? 'Update order' : 'Place order' }}
                    </BaseButton>
                </template>
            </UCard>
        </aside>
        </div>

        <div v-if="showBottomBar" class="fixed inset-x-0 bottom-0 z-10 border-t border-default bg-muted/95 shadow-sm backdrop-blur-sm lg:hidden">
            <div class="mx-auto max-w-2xl space-y-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <template v-if="!isLoggedIn">
                    <div class="flex items-center justify-between gap-3">
                        <p class="text-sm text-muted">Log in to place an order.</p>
                        <div class="flex shrink-0 gap-2">
                            <BaseButton size="sm" color="neutral" variant="soft" :to="`/register?redirect=${encodeURIComponent(route.fullPath)}`">
                                Sign up
                            </BaseButton>
                            <BaseButton size="sm" :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`">
                                Log in
                            </BaseButton>
                        </div>
                    </div>
                </template>

                <template v-else-if="!isApproved">
                    <p class="flex items-center gap-1.5 text-sm text-info">
                        <UIcon name="i-lucide-clock" class="size-4 shrink-0" />
                        Waiting on admin approval. You can order once approved, keep browsing meanwhile.
                    </p>
                </template>

                <template v-else-if="isBlockedByReceivable">
                    <div class="flex items-center justify-between gap-3">
                        <p class="flex items-center gap-1.5 text-sm text-warning">
                            <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
                            ₱{{ receivable.toFixed(2) }} unpaid. Settle to order again.
                        </p>
                        <BaseButton size="sm" color="warning" variant="soft" to="/customer/orders" class="shrink-0">
                            View orders
                        </BaseButton>
                    </div>
                </template>

                <template v-else>
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-xs text-muted">{{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}</p>
                            <p class="font-mono tabular-nums text-lg font-semibold text-highlighted">₱{{ total.toFixed(2) }}</p>
                        </div>
                        <BaseButton
                            size="lg"
                            :disabled="!schedule?.is_open || !hasItems"
                            @click="isCartOpen = true"
                        >
                            <template #leading>
                                <IconBasket class="size-5" />
                            </template>
                            View basket
                        </BaseButton>
                    </div>
                </template>
            </div>
        </div>

        <BaseModal :open="isQuickAddOpen" :title="quickAddProduct ? displayName(quickAddProduct) : undefined" @update:open="isQuickAddOpen = $event">
            <template #default>
                <div v-if="quickAddProduct" class="space-y-4">
                    <img
                        v-if="quickAddProduct.image_url && !imageLoadFailed[quickAddProduct.uuid]"
                        :src="quickAddProduct.image_url"
                        class="max-h-64 w-full rounded-lg object-contain bg-elevated"
                        :alt="displayName(quickAddProduct)"
                        @error="onImageError(quickAddProduct!.uuid)"
                    >
                    <div v-else class="flex h-40 items-center justify-center rounded-lg bg-elevated text-dimmed">
                        <UIcon name="i-lucide-image-off" class="size-8" />
                    </div>

                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p class="text-lg font-semibold text-highlighted">
                            <span class="font-mono tabular-nums">₱{{ resolvedPrice(quickAddProduct) }}</span>
                            <span class="text-xs font-normal text-dimmed">{{ isPriceConfirmed(quickAddProduct) ? 'confirmed' : 'estimated' }}</span>
                        </p>
                        <UBadge v-if="resolvedStatus(quickAddProduct) === 'b1t1'" color="success" variant="subtle" size="sm" icon="i-lucide-check">
                            B1T1
                        </UBadge>
                    </div>

                    <UBadge v-if="resolvedStatus(quickAddProduct) === 'out_of_stock'" color="error" variant="subtle" size="sm">
                        Out of stock
                    </UBadge>
                    <div v-else class="flex items-center justify-between gap-3">
                        <BaseQuantityInput
                            :model-value="quantities[quickAddProduct.uuid] || 0"
                            :min="0"
                            size="lg"
                            :color="quantities[quickAddProduct.uuid] ? 'primary' : 'neutral'"
                            :variant="quantities[quickAddProduct.uuid] ? 'subtle' : 'ghost'"
                            :disabled="!schedule?.is_open"
                            :aria-label="`Quantity for ${displayName(quickAddProduct)}`"
                            @update:model-value="(value: number | null) => setQuantity(quickAddProduct!, value)"
                        />
                        <p v-if="quantities[quickAddProduct.uuid]" class="font-mono tabular-nums text-lg font-semibold text-highlighted">
                            ₱{{ (Number(resolvedPrice(quickAddProduct)) * quantities[quickAddProduct.uuid]!).toFixed(2) }}
                        </p>
                    </div>
                </div>
            </template>
            <template #footer>
                <BaseButton block color="neutral" variant="soft" @click="isQuickAddOpen = false">
                    Done
                </BaseButton>
            </template>
        </BaseModal>

        <USlideover
            v-model:open="isCartOpen"
            side="bottom"
            title="Your basket"
            :description="`${itemCount} item${itemCount === 1 ? '' : 's'}`"
        >
            <template #body>
                <div v-if="cartItems.length === 0" class="flex flex-col items-center gap-3 py-10">
                    <IconBasket class="size-8 text-dimmed" />
                    <p class="text-sm text-muted">Your basket is empty.</p>
                </div>

                <div v-else class="divide-y divide-default">
                    <div v-for="product in cartItems" :key="product.uuid" class="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                        <button
                            type="button"
                            class="flex min-w-0 flex-1 items-center gap-4 text-left"
                            :aria-label="`View ${displayName(product)}`"
                            @click="viewCartItem(product)"
                        >
                            <img
                                v-if="product.image_url && !imageLoadFailed[product.uuid]"
                                :src="product.image_url"
                                loading="lazy"
                                class="size-12 shrink-0 rounded-lg object-cover"
                                alt=""
                                @error="onImageError(product.uuid)"
                            >
                            <div v-else class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-elevated text-dimmed">
                                <UIcon name="i-lucide-image" class="size-5" />
                            </div>

                            <div class="min-w-0 flex-1">
                                <p class="truncate font-medium text-highlighted">{{ displayName(product) }}</p>
                                <p class="font-mono tabular-nums text-sm font-medium text-highlighted">
                                    ₱{{ (Number(resolvedPrice(product)) * quantities[product.uuid]!).toFixed(2) }}
                                </p>
                                <UBadge v-if="resolvedStatus(product) === 'out_of_stock'" color="error" variant="subtle" size="sm" class="mt-1">
                                    Out of stock
                                </UBadge>
                                <UBadge v-else-if="resolvedStatus(product) === 'b1t1'" color="success" variant="subtle" size="sm" class="mt-1">
                                    B1T1
                                </UBadge>
                            </div>
                        </button>

                        <div class="flex shrink-0 items-center gap-2">
                            <BaseButton
                                icon="i-lucide-minus"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                class="min-h-11 min-w-11"
                                :aria-label="`Decrease quantity for ${displayName(product)}`"
                                :disabled="!schedule?.is_open"
                                @click="decrement(product)"
                            />
                            <span class="w-6 text-center font-mono tabular-nums font-medium">{{ quantities[product.uuid] || 0 }}</span>
                            <BaseButton
                                icon="i-lucide-plus"
                                size="xs"
                                color="neutral"
                                variant="soft"
                                class="min-h-11 min-w-11"
                                :aria-label="`Increase quantity for ${displayName(product)}`"
                                :disabled="!schedule?.is_open || resolvedStatus(product) === 'out_of_stock'"
                                @click="increment(product)"
                            />
                        </div>
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="w-full space-y-3">
                    <UAlert
                        v-if="isBlockedByReceivable"
                        color="warning"
                        variant="subtle"
                        icon="i-lucide-circle-alert"
                        title="Settle your balance to order"
                        :description="`You have ₱${receivable.toFixed(2)} in unpaid orders. Settle it before placing a new one.`"
                    >
                        <template #actions>
                            <BaseButton size="xs" color="warning" variant="solid" to="/customer/orders">
                                View my orders
                            </BaseButton>
                        </template>
                    </UAlert>

                    <template v-else>
                        <UAlert v-if="submitError" color="error" variant="subtle" :title="submitError" />
                        <div class="flex items-center justify-between">
                            <p class="text-sm text-muted">Total</p>
                            <p class="font-mono tabular-nums text-lg font-semibold text-highlighted">₱{{ total.toFixed(2) }}</p>
                        </div>
                        <BaseButton
                            block
                            size="lg"
                            :loading="submitting"
                            :disabled="!schedule?.is_open || !hasItems"
                            @click="submitOrder"
                        >
                            {{ editingOrder ? 'Update order' : 'Place order' }}
                        </BaseButton>
                    </template>
                </div>
            </template>
        </USlideover>
    </div>
</template>

<script setup lang="ts">
import { publicPasabuyService } from '@/components/api/public/PublicPasabuyService'
import { publicProductService } from '@/components/api/public/PublicProductService'
import { publicProductCategoryService } from '@/components/api/public/PublicProductCategoryService'
import { customerOrderService } from '@/components/api/customer/CustomerOrderService'
import APIError from '@/components/api/user/APIError'
import type { PasabuyShelfItem } from '@/components/pasabuy/PasabuyCategoryShelf.vue'
import type { InputMenuItem } from '@nuxt/ui'
import type { Category } from '@/types/Category'
import type { Product } from '@/types/Product'
import type { Schedule, ScheduleProduct } from '@/types/Schedule'

type ProductSuggestionItem = InputMenuItem & { product: Product }

definePageMeta({ layout: false })

interface MyOrderItem {
    uuid: string
    product_uuid: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_out_of_stock: boolean
    quantity: number
    bonus_quantity: number
    subtotal: string
}

interface MyOrder {
    uuid: string
    status: 'pending' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    is_cancellable: boolean
    items: MyOrderItem[]
    pasabuy_schedule: { uuid: string } | null
}

const route = useRoute()
const router = useRouter()
const uuid = route.params.uuid as string
const toast = useToast()
const { user, fetchCurrentUser } = useAuth()
const { displayName } = useProductDisplayName()

const schedule = ref<Schedule | null>(null)
const { data: catalog, ensure: ensureCatalogLoaded } = useCachedFetch<Product[]>(
    'public-product-catalog',
    (etag) => publicProductService.fetchCatalogCacheable({ per_page: 200 }, etag)
)
const loading = ref(true)
const notFound = ref(false)

useHead({ title: computed(() => schedule.value?.title ?? 'Pasabuy Run') })
const productSearch = ref('')

const quantities = ref<Record<string, number>>({})
const isCartOpen = ref(false)
const isFiltersOpen = ref(false)

/**
 * Single source of truth for product filters. The inline desktop row reads
 * and writes `filters.applied` directly (live filtering); the mobile
 * USlideover reads and writes `filters.draft`, only copied over to
 * `applied` on "Show N Results". This keeps the intentional draft/apply UX
 * without maintaining two parallel trees of refs plus a sync watcher.
 */
interface ProductFilters {
    status: string
    sortByPrice: string
    priceMin: number | null
    priceMax: number | null
}

function createDefaultFilters(): ProductFilters {
    return { status: 'all', sortByPrice: 'none', priceMin: null, priceMax: null }
}

const filters = reactive({
    applied: createDefaultFilters(),
    draft: createDefaultFilters()
})

const activeFilterCount = computed(() =>
    [
        filters.applied.status !== 'all',
        filters.applied.sortByPrice !== 'none',
        filters.applied.priceMin !== null,
        filters.applied.priceMax !== null
    ].filter(Boolean).length
)

watch(isFiltersOpen, (open) => {
    if (!open) return
    Object.assign(filters.draft, filters.applied)
})

function clearDraftFilters() {
    Object.assign(filters.draft, createDefaultFilters())
}

function applyDraftFilters() {
    Object.assign(filters.applied, filters.draft)
    isFiltersOpen.value = false
}

const statusFilterOptions = [
    { label: 'All statuses', value: 'all' },
    { label: 'Buy 1 Take 1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' },
    { label: 'Regular price', value: 'none' }
]

const sortByPriceOptions = [
    { label: 'Default order', value: 'none' },
    { label: 'Price: Low to High', value: 'asc' },
    { label: 'Price: High to Low', value: 'desc' }
]

const imageLoadFailed = ref<Record<string, boolean>>({})

function onImageError(productUuid: string) {
    imageLoadFailed.value[productUuid] = true
}

const submitting = ref(false)
const submitError = ref<string | null>(null)
const myOrder = ref<MyOrder | null>(null)
const myOrderEtag = ref<string | null>(null)
const editingOrder = ref(false)

const isLoggedIn = computed(() => !!user.value)
const isApproved = computed(() => user.value?.is_approved === true)

const isValidToOrder = computed(() => user.value?.is_valid_to_order !== false)
const receivable = computed(() => Number(user.value?.receivable ?? 0))

/**
 * Editing an already-placed order is always allowed regardless of receivable
 * (the backend only gates *new* order creation on it), so the blocked state
 * below must not apply while editingOrder is true.
 */
const isBlockedByReceivable = computed(() => isValidToOrder.value === false && !editingOrder.value)

const PRICING_NOTE_DISMISSED_KEY = 'pasabuy-pricing-note-dismissed'
const pricingNoteDismissed = ref(false)
if (import.meta.client) {
    pricingNoteDismissed.value = localStorage.getItem(PRICING_NOTE_DISMISSED_KEY) === 'true'
}
function dismissPricingNote() {
    pricingNoteDismissed.value = true
    if (import.meta.client) {
        localStorage.setItem(PRICING_NOTE_DISMISSED_KEY, 'true')
    }
}

const showBottomBar = computed(() => !!schedule.value && (!myOrder.value || editingOrder.value))

const scheduleProductByUuid = computed(() => {
    const map = new Map<string, ScheduleProduct>()
    for (const scheduleProduct of schedule.value?.products ?? []) {
        if (scheduleProduct.product) map.set(scheduleProduct.product.uuid, scheduleProduct)
    }
    return map
})

function resolvedStatus(product: Product) {
    return scheduleProductByUuid.value.get(product.uuid)?.product_status ?? product.default_product_status
}

function resolvedPrice(product: Product): string {
    const scheduleProduct = scheduleProductByUuid.value.get(product.uuid)
    if (scheduleProduct?.actual_price !== null && scheduleProduct?.actual_price !== undefined) return scheduleProduct.actual_price
    return product.default_price
}

function isPriceConfirmed(product: Product): boolean {
    const scheduleProduct = scheduleProductByUuid.value.get(product.uuid)
    return scheduleProduct?.actual_price !== null && scheduleProduct?.actual_price !== undefined
}

const catalogItems = computed(() => catalog.value ?? [])

const showFilters = computed(() => isLeafCategory.value)

/**
 * Suggestions hit the backend catalog directly instead of filtering the
 * locally prefetched 200-item page, so results include products outside
 * that page (e.g. anything beyond the prefetch cap or added since it was
 * cached). Picking a suggestion opens quick-add directly; there's no
 * separate flat "search results" list since the dropdown already covers it.
 */
const suggestionProducts = ref<Product[]>([])
let suggestionRequestId = 0

const knownProducts = ref<Record<string, Product>>({})

watch(catalogItems, (items) => {
    for (const product of items) knownProducts.value[product.uuid] = product
}, { immediate: true })

const suggestionsLoading = ref(false)

async function fetchSuggestions() {
    const query = productSearch.value.trim()
    if (!query) {
        suggestionsLoading.value = false
        suggestionProducts.value = []
        return
    }

    const requestId = ++suggestionRequestId
    suggestionsLoading.value = true
    try {
        const result = await publicProductService.fetchCatalog({ search: query, per_page: 8 })
        if (requestId !== suggestionRequestId) return
        const items = result.data.items as Product[]
        suggestionProducts.value = items
        for (const product of items) knownProducts.value[product.uuid] = product
    } catch {
        if (requestId !== suggestionRequestId) return
        suggestionProducts.value = []
    } finally {
        if (requestId === suggestionRequestId) suggestionsLoading.value = false
    }
}

useSearchDebounce(productSearch, fetchSuggestions, 500)

const searchSuggestionItems = computed<ProductSuggestionItem[]>(() =>
    suggestionProducts.value.map((product) => ({
        label: displayName(product),
        description: `₱${resolvedPrice(product)}${product.category ? ` · ${product.category.name}` : ''}`,
        product
    }))
)

function onSearchSuggestionSelect(item: InputMenuItem) {
    const product = (item as ProductSuggestionItem)?.product
    if (!product) return
    openQuickAdd(product)
}

const currentCategoryUuid = ref<string | null>(null)
const currentCategory = ref<Category | null>(null)
const children = ref<Category[]>([])
const loadingCategoryTree = ref(true)
const categoryTreeError = ref('')
const categoryTreeNotFound = ref(false)

const isLeafCategory = computed(() => !!currentCategoryUuid.value && !categoryTreeNotFound.value && !loadingCategoryTree.value && children.value.length === 0)
const branchChildren = computed(() => children.value.filter((child) => child.has_children))
const leafChildren = computed(() => children.value.filter((child) => !child.has_children))

function isOddLastBranchTile(index: number) {
    return branchChildren.value.length % 2 === 1 && index === branchChildren.value.length - 1
}

function drillInto(categoryUuid: string) {
    currentCategoryUuid.value = categoryUuid
}

function goBackCategory() {
    currentCategoryUuid.value = currentCategory.value?.parent_uuid ?? null
}

function shelfItemsFor(categoryUuid: string): PasabuyShelfItem[] {
    return catalogItems.value
        .filter((product) => product.category?.uuid === categoryUuid)
        .slice(0, 10)
        .map((product) => ({
            product,
            name: displayName(product),
            price: resolvedPrice(product),
            confirmed: isPriceConfirmed(product),
            status: resolvedStatus(product),
            quantity: quantities.value[product.uuid] || 0
        }))
}

async function loadCategoryLevel() {
    loadingCategoryTree.value = true
    categoryTreeError.value = ''
    categoryTreeNotFound.value = false

    try {
        if (currentCategoryUuid.value) {
            const result = await publicProductCategoryService.fetchByUuidCacheable(currentCategoryUuid.value, null)
            if (result !== 'not-modified') currentCategory.value = result.data as Category
        } else {
            currentCategory.value = null
        }

        const childrenResult = await publicProductCategoryService.fetchChildrenCacheable(
            { parent_uuid: currentCategoryUuid.value ?? undefined },
            null
        )
        if (childrenResult !== 'not-modified') children.value = childrenResult.data as Category[]
    } catch (err) {
        if (err instanceof APIError && err.status === 404) {
            categoryTreeNotFound.value = true
        } else {
            categoryTreeError.value = err instanceof APIError ? err.message : 'Something went wrong loading categories.'
        }
    } finally {
        loadingCategoryTree.value = false
    }
}

watch(currentCategoryUuid, () => loadCategoryLevel())

function matchesCategory(product: Product): boolean {
    if (currentCategoryUuid.value) return product.category?.uuid === currentCategoryUuid.value
    return true
}

function matchesAdvancedFilters(product: Product, status: string, min: number | null, max: number | null): boolean {
    if (status !== 'all' && resolvedStatus(product) !== status) return false
    const price = Number(resolvedPrice(product))
    if (min !== null && price < min) return false
    if (max !== null && price > max) return false
    return true
}

const filteredProducts = computed(() => {
    const items = catalogItems.value.filter((product) =>
        matchesCategory(product) && matchesAdvancedFilters(product, filters.applied.status, filters.applied.priceMin, filters.applied.priceMax)
    )

    if (filters.applied.sortByPrice === 'none') return items

    return [...items].sort((a, b) => {
        const diff = Number(resolvedPrice(a)) - Number(resolvedPrice(b))
        return filters.applied.sortByPrice === 'asc' ? diff : -diff
    })
})

const draftFilteredCount = computed(() =>
    catalogItems.value.filter((product) =>
        matchesCategory(product) && matchesAdvancedFilters(product, filters.draft.status, filters.draft.priceMin, filters.draft.priceMax)
    ).length
)

const isDesktop = useIsDesktop()
const initialBatchSize = computed(() => isDesktop.value ? 24 : 18)
const visibleCount = ref(initialBatchSize.value)

const visibleProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value))
const hasMoreProducts = computed(() => visibleCount.value < filteredProducts.value.length)

function loadMoreProducts() {
    visibleCount.value += initialBatchSize.value
}

watch(
    [currentCategoryUuid, () => filters.applied.status, () => filters.applied.sortByPrice, () => filters.applied.priceMin, () => filters.applied.priceMax, isDesktop],
    () => {
        visibleCount.value = initialBatchSize.value
    }
)

const cartItems = computed(() => Object.values(knownProducts.value).filter((product) => (quantities.value[product.uuid] || 0) > 0))

const total = computed(() => {
    return Object.values(knownProducts.value).reduce((sum, product) => {
        const qty = quantities.value[product.uuid] || 0
        return sum + qty * Number(resolvedPrice(product))
    }, 0)
})

const itemCount = computed(() => Object.values(quantities.value).reduce((sum, qty) => sum + qty, 0))
const hasItems = computed(() => itemCount.value > 0)

const isQuickAddOpen = ref(false)
const quickAddProduct = ref<Product | null>(null)

function openQuickAdd(product: Product) {
    quickAddProduct.value = product
    isQuickAddOpen.value = true
}

function viewCartItem(product: Product) {
    isCartOpen.value = false
    openQuickAdd(product)
}

/**
 * Deep-link support for "Send to a pasabuy" on the Blue Basket page: ?basket=1
 * seeds every basket item's quantity into this schedule's cart (matched by
 * product uuid against the shared global catalog). The cart drawer is left
 * closed — auto-opening it used to skip straight to "Place order" for
 * customers who are currently blocked by an unpaid balance, bypassing the
 * warning state entirely. A toast confirms the items landed instead.
 */
async function applyBasketSeed() {
    if (route.query.basket !== '1') return

    const { basket: basketItems } = useBasket()
    const items = basketItems.value?.items ?? []
    let added = 0
    let skipped = 0

    for (const item of items) {
        const product = knownProducts.value[item.product_uuid]
        if (!product) {
            skipped++
            continue
        }
        quantities.value[product.uuid] = (quantities.value[product.uuid] || 0) + item.quantity
        added++
    }

    if (added > 0) {
        toast.add({
            title: `${added} item${added === 1 ? '' : 's'} added to your basket`,
            description: schedule.value?.title,
            color: 'success'
        })
    }

    if (skipped > 0) {
        toast.add({
            title: `${skipped} item${skipped === 1 ? '' : 's'} couldn't be added`,
            description: "They aren't available in this pasabuy",
            color: 'warning'
        })
    }

    const { basket: _omit, ...rest } = route.query
    router.replace({ query: rest })
}

/**
 * Deep-link support for "Order this in a pasabuy" on the product detail
 * page: ?product={uuid} pre-opens quick-add for that exact product, so a
 * customer never has to remember its name and hunt for it in the catalog.
 */
async function applyPreselectedProduct() {
    const productUuid = route.query.product as string | undefined
    if (!productUuid) return

    let product = knownProducts.value[productUuid] ?? null
    if (!product) {
        try {
            const result = await publicProductService.fetchByUuidCacheable(productUuid, null)
            if (result !== 'not-modified') {
                product = result.data as Product
                knownProducts.value[product.uuid] = product
            }
        } catch {
            product = null
            toast.add({ title: "Couldn't load that item", description: 'Browse below to find it', color: 'error' })
        }
    }

    if (product) {
        if (myOrder.value) {
            startEditOrder()
            toast.add({ title: 'Now editing your order', description: schedule.value?.title, color: 'success' })
        }
        openQuickAdd(product)
    }

    const { product: _omit, ...rest } = route.query
    router.replace({ query: rest })
}

async function load(force = false) {
    loading.value = true
    try {
        const [scheduleResponse] = await Promise.all([
            publicPasabuyService.fetchSchedule(uuid),
            ensureCatalogLoaded(force)
        ])
        schedule.value = scheduleResponse.data
        for (const product of catalogItems.value) {
            if (quantities.value[product.uuid] === undefined) {
                quantities.value[product.uuid] = 0
            }
        }
    } catch (error) {
        if (error instanceof APIError) {
            notFound.value = true
        } else {
            throw error
        }
    } finally {
        loading.value = false
    }
}

async function restoreSession() {
    if (!import.meta.client) return
    if (!localStorage.getItem('_token')) return
    try {
        await fetchCurrentUser()
    } catch {
        // invalid/expired token: treat as logged out
    }
}

/**
 * Customers can only have one active (pending/confirmed) order per schedule:
 * find it, if any, so we show its summary instead of a fresh ordering form.
 */
async function loadMyOrder() {
    try {
        const result = await customerOrderService.fetchMyOrdersCacheable({ per_page: 100 }, myOrderEtag.value)
        if (result === 'not-modified') return
        const orders = result.data.items as MyOrder[]
        myOrder.value = orders.find((o) => o.pasabuy_schedule?.uuid === uuid && o.status !== 'cancelled') ?? null
        myOrderEtag.value = result.etag
    } catch {
        // non-critical, fall back to showing a fresh ordering form
    }
}

const cancellingOrder = ref(false)

async function cancelOrder() {
    if (!myOrder.value) return
    cancellingOrder.value = true
    try {
        await customerOrderService.cancelOrder(myOrder.value.uuid)
        myOrder.value = null
        toast.add({ title: 'Order cancelled', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Failed to cancel', description: (error as APIError).message, color: 'error' })
    } finally {
        cancellingOrder.value = false
    }
}

function startEditOrder() {
    if (!myOrder.value) return
    for (const product of catalogItems.value) {
        quantities.value[product.uuid] = 0
    }
    for (const item of myOrder.value.items) {
        quantities.value[item.product_uuid] = item.quantity
    }
    submitError.value = null
    editingOrder.value = true
}

function cancelEditOrder() {
    editingOrder.value = false
    submitError.value = null
}

function increment(product: Product) {
    const current = quantities.value[product.uuid] || 0
    quantities.value[product.uuid] = current + 1
}

function decrement(product: Product) {
    const current = quantities.value[product.uuid] || 0
    quantities.value[product.uuid] = Math.max(0, current - 1)
}

function setQuantity(product: Product, value: number | null) {
    quantities.value[product.uuid] = Math.max(0, Math.floor(value ?? 0))
}

async function clearBasketAfterCheckout() {
    const { clear: clearBasket } = useBasket()
    await clearBasket()
    cameFromBasket.value = false
}

async function submitOrder() {
    submitError.value = null
    submitting.value = true
    try {
        const items = Object.entries(quantities.value)
            .filter(([, qty]) => qty > 0)
            .map(([product_uuid, quantity]) => ({ product_uuid, quantity }))

        if (myOrder.value) {
            const response = await customerOrderService.updateMyOrder(myOrder.value.uuid, items)
            myOrder.value = response.data
            editingOrder.value = false
            isCartOpen.value = false
            if (cameFromBasket.value) await clearBasketAfterCheckout()
            toast.add({ title: 'Order updated', color: 'success' })
        } else {
            const response = await customerOrderService.placeOrder(uuid, items)
            if (cameFromBasket.value) await clearBasketAfterCheckout()
            await fetchCurrentUser()
            toast.add({ title: 'Order placed!', color: 'success' })
            await navigateTo(`/customer/orders/${response.data.uuid}?placed=1`)
        }
    } catch (error) {
        submitError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        submitting.value = false
    }
}

const { $echo } = useNuxtApp()
let orderChannelUuid: string | null = null

function subscribeToMyOrder() {
    if (!myOrder.value || orderChannelUuid === myOrder.value.uuid) return
    unsubscribeFromMyOrder()
    orderChannelUuid = myOrder.value.uuid
    $echo.channel(`order.${orderChannelUuid}`).listen('.order.status.changed', applyBroadcastOrderUpdate)
}

function unsubscribeFromMyOrder() {
    if (!orderChannelUuid) return
    $echo.leaveChannel(`order.${orderChannelUuid}`)
    orderChannelUuid = null
}

function applyBroadcastOrderUpdate(updatedOrder: MyOrder) {
    if (!myOrder.value || myOrder.value.uuid !== updatedOrder.uuid) return
    if (updatedOrder.status === 'cancelled') {
        myOrder.value = null
        return
    }
    myOrder.value = updatedOrder
}

watch(myOrder, () => {
    if (myOrder.value) {
        subscribeToMyOrder()
    } else {
        unsubscribeFromMyOrder()
    }
})

const cameFromBasket = ref(false)

onMounted(async () => {
    await restoreSession()
    await Promise.all([load(), loadCategoryLevel()])
    if (isLoggedIn.value && isApproved.value) {
        await loadMyOrder()
    }
    if (route.query.basket === '1') {
        cameFromBasket.value = true
        await applyBasketSeed()
    }
    await applyPreselectedProduct()
})

onPullToRefresh(async () => {
    imageLoadFailed.value = {}
    await load(true)
    if (isLoggedIn.value && isApproved.value) {
        await loadMyOrder()
    }
})

onUnmounted(() => {
    unsubscribeFromMyOrder()
})
</script>
