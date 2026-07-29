<template>
    <div class="min-h-full space-y-4" @touchstart="onTabsTouchStart" @touchmove="onTabsTouchMove" @touchend="onTabsTouchEnd">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">Products</h1>
            <BaseButton v-if="activeTab === 'products'" icon="i-lucide-plus" class="hidden sm:inline-flex" @click="openProductCreateModal">Add Product</BaseButton>
            <BaseButton v-else-if="activeTab === 'categories'" icon="i-lucide-plus" class="hidden sm:inline-flex" @click="openCategoryCreateModal">Add Category</BaseButton>
            <BaseButton v-else icon="i-lucide-plus" class="hidden sm:inline-flex" @click="openBrandCreateModal">Add Brand</BaseButton>
        </div>

        <FabButton v-if="activeTab === 'products'" aria-label="Add product" @click="openProductCreateModal" />
        <FabButton v-else-if="activeTab === 'categories'" aria-label="Add category" @click="openCategoryCreateModal" />
        <FabButton v-else aria-label="Add brand" @click="openBrandCreateModal" />

        <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <template #products>
                <div class="overflow-x-clip">
                <div class="mt-4 space-y-4" ref="panelEl">
                    <div class="sticky top-0 z-10 -mx-6 space-y-2 bg-default/95 px-6 py-2 backdrop-blur-sm">
                        <div class="flex items-center gap-2">
                            <div class="min-w-0 flex-1">
                                <SearchInput v-model="productSearch" placeholder="Search products…" class="w-full" />
                            </div>
                            <BaseButton
                                class="sm:hidden shrink-0"
                                color="neutral"
                                variant="outline"
                                icon="i-lucide-list-filter"
                                @click="isProductFiltersOpen = true"
                            >
                                Filters
                                <UBadge v-if="productActiveFilterCount" color="primary" variant="subtle" size="sm">{{ productActiveFilterCount }}</UBadge>
                            </BaseButton>
                        </div>

                        <div v-if="categoryFilterTabs.length > 2" data-swipe-ignore>
                            <UTabs
                                v-model="productCategoryFilter"
                                :items="categoryFilterTabs"
                                variant="pill"
                                size="md"
                                class="w-full"
                                :ui="{ list: 'flex-nowrap overflow-x-auto', trigger: 'grow-0 shrink-0 min-w-20 justify-center py-2.5' }"
                            />
                        </div>

                        <div v-if="brandFilterOptions.length > 2" class="w-full sm:w-56">
                            <USelect
                                v-model="productBrandFilter"
                                :items="brandFilterOptions"
                                value-key="value"
                                placeholder="Brand"
                                class="w-full h-11"
                            />
                        </div>

                        <div class="hidden sm:grid grid-cols-4 gap-2">
                            <USelect
                                v-model="productStatusFilter"
                                :items="statusFilterOptions"
                                value-key="value"
                                placeholder="Status"
                                class="w-full h-11"
                            />
                            <USelect
                                v-model="productSortByPrice"
                                :items="sortByPriceOptions"
                                value-key="value"
                                placeholder="Sort by price"
                                class="w-full h-11"
                            />
                            <UInput
                                v-model.number="productPriceMin"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Min price"
                                class="w-full"
                                :ui="{ base: 'h-11' }"
                            />
                            <UInput
                                v-model.number="productPriceMax"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Max price"
                                class="w-full"
                                :ui="{ base: 'h-11' }"
                            />
                        </div>
                    </div>

                    <USlideover v-model:open="isProductFiltersOpen" side="bottom" title="Filters">
                        <template #body>
                            <div class="space-y-4">
                                <UFormField v-if="brandFilterOptions.length > 2" label="Brand">
                                    <USelect v-model="productBrandFilter" :items="brandFilterOptions" value-key="value" class="w-full h-11" />
                                </UFormField>
                                <UFormField label="Status">
                                    <USelect v-model="productStatusFilter" :items="statusFilterOptions" value-key="value" class="w-full h-11" />
                                </UFormField>
                                <UFormField label="Sort by price">
                                    <USelect v-model="productSortByPrice" :items="sortByPriceOptions" value-key="value" class="w-full h-11" />
                                </UFormField>
                                <div class="grid grid-cols-2 gap-4">
                                    <UFormField label="Min price">
                                        <UInput v-model.number="productPriceMin" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" :ui="{ base: 'h-11' }" />
                                    </UFormField>
                                    <UFormField label="Max price">
                                        <UInput v-model.number="productPriceMax" type="number" min="0" step="0.01" placeholder="0.00" class="w-full" :ui="{ base: 'h-11' }" />
                                    </UFormField>
                                </div>
                            </div>
                        </template>
                        <template #footer>
                            <div class="w-full flex items-center gap-2">
                                <BaseButton class="flex-1" color="neutral" variant="outline" @click="clearProductFilters">Clear filters</BaseButton>
                                <BaseButton class="flex-1" @click="isProductFiltersOpen = false">Done</BaseButton>
                            </div>
                        </template>
                    </USlideover>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <ResponsiveTable
                            :data="products"
                            :columns="productColumns"
                            :loading="productsLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                        >
                            <template #image-cell="{ row }">
                                <img
                                    v-if="row.original.image_url && !imageLoadFailed[row.original.uuid]"
                                    :src="row.original.image_url"
                                    loading="lazy"
                                    class="size-12 rounded-lg object-cover ring-1 ring-default"
                                    alt=""
                                    @error="onImageError(row.original.uuid)"
                                >
                                <div v-else class="flex items-center justify-center size-12 rounded-lg bg-elevated text-dimmed">
                                    <UIcon name="i-lucide-image" class="size-5" />
                                </div>
                            </template>
                            <template #product-cell="{ row }">
                                <p class="font-medium text-highlighted">{{ row.original.name }}</p>
                                <p v-if="row.original.description" class="text-sm text-muted truncate max-w-xs">
                                    {{ row.original.description }}
                                </p>
                            </template>
                            <template #category-cell="{ row }">
                                <span class="text-sm text-muted">{{ row.original.category?.name ?? '-' }}</span>
                            </template>
                            <template #brand-cell="{ row }">
                                <div v-if="row.original.brand" class="flex items-center gap-2">
                                    <img
                                        v-if="row.original.brand.logo_url"
                                        :src="row.original.brand.logo_url"
                                        loading="lazy"
                                        class="size-5 rounded object-contain"
                                        alt=""
                                    >
                                    <span class="text-sm text-muted">{{ row.original.brand.name }}</span>
                                </div>
                                <span v-else class="text-sm text-muted">-</span>
                            </template>
                            <template #default_price-cell="{ row }">
                                <span class="font-medium text-highlighted">₱{{ row.original.default_price }}</span>
                            </template>
                            <template #is_active-cell="{ row }">
                                <StatusBadge
                                    :color="row.original.is_active ? 'success' : 'neutral'"
                                    :label="row.original.is_active ? 'Active' : 'Inactive'"
                                />
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end gap-1">
                                    <BaseButton
                                        icon="i-lucide-pencil"
                                        size="sm"
                                        color="neutral"
                                        variant="ghost"
                                        aria-label="Edit product"
                                        @click="openProductEditModal(row.original)"
                                    />
                                    <BaseButton
                                        icon="i-lucide-trash-2"
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Delete product"
                                        @click="onDeleteProduct(row.original)"
                                    />
                                </div>
                            </template>
                            <template #list-item="{ item: product }">
                                <ListCard clickable :dimmed="!product.is_active" :actions="productActions(product)" @click="openProductPreview(product)">
                                    <template #leading>
                                        <img
                                            v-if="product.image_url && !imageLoadFailed[product.uuid]"
                                            :src="product.image_url"
                                            loading="lazy"
                                            class="size-12 rounded-lg object-cover ring-1 ring-default"
                                            alt=""
                                            @error="onImageError(product.uuid)"
                                        >
                                        <div v-else class="flex items-center justify-center size-12 rounded-lg bg-elevated text-dimmed">
                                            <UIcon name="i-lucide-image" class="size-5" />
                                        </div>
                                    </template>
                                    <template #title>
                                        <p class="min-w-0 truncate font-medium text-highlighted">{{ product.name }}</p>
                                    </template>
                                    <template #meta>
                                        <span class="text-muted">{{ product.category?.name ?? '-' }}</span>
                                        <span v-if="product.brand" class="inline-flex items-center gap-1 text-muted">
                                            ·
                                            <img v-if="product.brand.logo_url" :src="product.brand.logo_url" class="size-4 rounded object-contain" alt="">
                                            {{ product.brand.name }}
                                        </span>
                                    </template>
                                    <template #status>
                                        <div class="flex w-full items-center justify-between">
                                            <StatusBadge
                                                :color="product.is_active ? 'success' : 'neutral'"
                                                :label="product.is_active ? 'Active' : 'Inactive'"
                                            />
                                            <span class="font-medium text-highlighted">₱{{ product.default_price }}</span>
                                        </div>
                                    </template>
                                </ListCard>
                            </template>
                            <template #empty>
                                <TableEmptyState
                                    icon="i-lucide-package-search"
                                    message="No products found."
                                    action-label="Add your first product"
                                    @action="openProductCreateModal"
                                />
                            </template>
                        </ResponsiveTable>
                    </UCard>

                    <div v-if="productsTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="productsPage" :total="productsTotal" :items-per-page="perPage" />
                    </div>
                </div>
                </div>
            </template>

            <template #categories>
                <div class="overflow-x-clip">
                <div class="mt-4 space-y-4" ref="panelEl">
                    <div class="sticky top-0 z-10 -mx-6 bg-default/95 px-6 py-2 backdrop-blur-sm">
                        <SearchInput v-model="categorySearch" placeholder="Search categories…" />
                    </div>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <ResponsiveTable
                            :data="categories"
                            :columns="categoryColumns"
                            :loading="categoriesLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors cursor-pointer' }"
                            @select="(_event: Event, row: { original: Category }) => viewCategoryProducts(row.original)"
                        >
                            <template #category-cell="{ row }">
                                <p class="font-medium text-highlighted">{{ row.original.name }}</p>
                                <p v-if="row.original.description" class="text-sm text-muted truncate max-w-xs">
                                    {{ row.original.description }}
                                </p>
                            </template>
                            <template #is_active-cell="{ row }">
                                <StatusBadge
                                    :color="row.original.is_active ? 'success' : 'neutral'"
                                    :label="row.original.is_active ? 'Active' : 'Inactive'"
                                />
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end gap-1">
                                    <BaseButton
                                        icon="i-lucide-pencil"
                                        size="sm"
                                        color="neutral"
                                        variant="ghost"
                                        aria-label="Edit category"
                                        @click.stop="openCategoryEditModal(row.original)"
                                    />
                                    <BaseButton
                                        icon="i-lucide-trash-2"
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Delete category"
                                        @click.stop="onDeleteCategory(row.original)"
                                    />
                                </div>
                            </template>
                            <template #list-item="{ item: category }">
                                <ListCard clickable :dimmed="!category.is_active" :actions="categoryActions(category)" @click="viewCategoryProducts(category)">
                                    <template #title>
                                        <p class="font-medium text-highlighted">{{ category.name }}</p>
                                    </template>
                                    <template #subtitle>
                                        <span v-if="category.description" class="truncate">{{ category.description }}</span>
                                    </template>
                                    <template #status>
                                        <StatusBadge
                                            :color="category.is_active ? 'success' : 'neutral'"
                                            :label="category.is_active ? 'Active' : 'Inactive'"
                                        />
                                    </template>
                                </ListCard>
                            </template>
                            <template #empty>
                                <TableEmptyState
                                    icon="i-lucide-tags"
                                    message="No categories found."
                                    action-label="Add your first category"
                                    @action="openCategoryCreateModal"
                                />
                            </template>
                        </ResponsiveTable>
                    </UCard>

                    <div v-if="categoriesTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="categoriesPage" :total="categoriesTotal" :items-per-page="perPage" />
                    </div>
                </div>
                </div>
            </template>

            <template #brands>
                <div class="overflow-x-clip">
                <div class="mt-4 space-y-4" ref="panelEl">
                    <div class="sticky top-0 z-10 -mx-6 bg-default/95 px-6 py-2 backdrop-blur-sm">
                        <SearchInput v-model="brandSearch" placeholder="Search brands…" />
                    </div>

                    <UCard :ui="{ body: 'p-0 sm:p-0' }">
                        <ResponsiveTable
                            :data="brands"
                            :columns="brandColumns"
                            :loading="brandsLoading"
                            :ui="{ tr: 'hover:bg-elevated/50 transition-colors' }"
                        >
                            <template #logo-cell="{ row }">
                                <img
                                    v-if="row.original.logo_url && !brandLogoLoadFailed[row.original.uuid]"
                                    :src="row.original.logo_url"
                                    loading="lazy"
                                    class="size-10 rounded-lg object-contain ring-1 ring-default bg-elevated"
                                    alt=""
                                    @error="onBrandLogoError(row.original.uuid)"
                                >
                                <div v-else class="flex items-center justify-center size-10 rounded-lg bg-elevated text-dimmed">
                                    <UIcon name="i-lucide-tag" class="size-4" />
                                </div>
                            </template>
                            <template #brand-cell="{ row }">
                                <p class="font-medium text-highlighted">{{ row.original.name }}</p>
                            </template>
                            <template #is_active-cell="{ row }">
                                <StatusBadge
                                    :color="row.original.is_active ? 'success' : 'neutral'"
                                    :label="row.original.is_active ? 'Active' : 'Inactive'"
                                />
                            </template>
                            <template #actions-cell="{ row }">
                                <div class="flex justify-end gap-1">
                                    <BaseButton
                                        icon="i-lucide-pencil"
                                        size="sm"
                                        color="neutral"
                                        variant="ghost"
                                        aria-label="Edit brand"
                                        @click="openBrandEditModal(row.original)"
                                    />
                                    <BaseButton
                                        icon="i-lucide-trash-2"
                                        size="sm"
                                        color="error"
                                        variant="ghost"
                                        aria-label="Delete brand"
                                        @click="onDeleteBrand(row.original)"
                                    />
                                </div>
                            </template>
                            <template #list-item="{ item: brand }">
                                <ListCard clickable :dimmed="!brand.is_active" :actions="brandActions(brand)" @click="openBrandEditModal(brand)">
                                    <template #leading>
                                        <img
                                            v-if="brand.logo_url && !brandLogoLoadFailed[brand.uuid]"
                                            :src="brand.logo_url"
                                            loading="lazy"
                                            class="size-10 rounded-lg object-contain ring-1 ring-default bg-elevated"
                                            alt=""
                                            @error="onBrandLogoError(brand.uuid)"
                                        >
                                        <div v-else class="flex items-center justify-center size-10 rounded-lg bg-elevated text-dimmed">
                                            <UIcon name="i-lucide-tag" class="size-4" />
                                        </div>
                                    </template>
                                    <template #title>
                                        <p class="font-medium text-highlighted">{{ brand.name }}</p>
                                    </template>
                                    <template #status>
                                        <StatusBadge
                                            :color="brand.is_active ? 'success' : 'neutral'"
                                            :label="brand.is_active ? 'Active' : 'Inactive'"
                                        />
                                    </template>
                                </ListCard>
                            </template>
                            <template #empty>
                                <TableEmptyState
                                    icon="i-lucide-tag"
                                    message="No brands found."
                                    action-label="Add your first brand"
                                    @action="openBrandCreateModal"
                                />
                            </template>
                        </ResponsiveTable>
                    </UCard>

                    <div v-if="brandsTotal > perPage" class="flex justify-center">
                        <UPagination v-model:page="brandsPage" :total="brandsTotal" :items-per-page="perPage" />
                    </div>
                </div>
                </div>
            </template>
        </UTabs>

        <BaseModal
            v-model:open="isProductModalOpen"
            :title="editingProduct ? 'Edit Product' : 'Add Product'"
            size="xl"
            show-default-footer
            form-id="product-form"
            :confirm-label="editingProduct ? 'Save' : 'Create'"
            :loading="savingProduct"
        >
            <form id="product-form" class="space-y-6" @submit.prevent="onSaveProduct">
                <div class="flex flex-col sm:flex-row gap-6">
                    <div class="sm:w-48 shrink-0 space-y-4">
                        <UFormField label="Image">
                            <UFileUpload v-model="productForm.image" accept="image/*">
                                <template #default="{ open }">
                                    <div class="flex items-center gap-3 sm:flex-col sm:items-stretch">
                                        <div
                                            class="relative shrink-0 size-24 sm:size-auto sm:w-full sm:aspect-square rounded-lg overflow-hidden ring-1 ring-default bg-elevated cursor-pointer"
                                            @click="open()"
                                        >
                                            <img
                                                v-if="productImagePreviewUrl"
                                                :src="productImagePreviewUrl"
                                                class="size-full object-cover"
                                                alt=""
                                            >
                                            <div v-else class="flex items-center justify-center size-full text-dimmed">
                                                <UIcon name="i-lucide-image-plus" class="size-6" />
                                            </div>
                                            <BaseButton
                                                v-if="productForm.image"
                                                icon="i-lucide-x"
                                                size="xs"
                                                color="neutral"
                                                variant="solid"
                                                class="absolute top-1 right-1 rounded-full"
                                                aria-label="Remove selected image"
                                                @click.stop="productForm.image = null"
                                            />
                                        </div>
                                        <BaseButton
                                            :label="productImagePreviewUrl ? 'Change photo' : 'Add photo'"
                                            color="neutral"
                                            variant="outline"
                                            size="sm"
                                            @click="open()"
                                        />
                                    </div>
                                </template>
                            </UFileUpload>
                        </UFormField>
                        <UFormField label="Active">
                            <USwitch v-model="productForm.is_active" label="Product is active" />
                        </UFormField>
                    </div>
                    <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <UFormField label="Name" required>
                            <UInput v-model="productForm.name" placeholder="Turbo 9inch fan" class="w-full" />
                        </UFormField>
                        <UFormField label="Default price" required>
                            <UInput v-model.number="productForm.default_price" type="number" min="0" step="0.01" placeholder="0.00" class="w-full">
                                <template #leading>
                                    <span class="text-sm text-dimmed">₱</span>
                                </template>
                            </UInput>
                        </UFormField>
                        <UFormField label="Category">
                            <USelect
                                v-model="productForm.category_id"
                                :items="categoryOptions"
                                value-key="value"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Brand">
                            <USelect
                                v-model="productForm.brand_id"
                                :items="brandOptions"
                                value-key="value"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Default product status">
                            <USelect
                                v-model="productForm.default_product_status"
                                :items="productStatusOptions"
                                value-key="value"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Description" class="sm:col-span-2">
                            <UTextarea v-model="productForm.description" placeholder="Short product description" class="w-full" :rows="3" />
                        </UFormField>
                    </div>
                </div>
            </form>
        </BaseModal>

        <BaseModal v-model:open="isProductPreviewOpen" :title="previewProduct?.name" view-only>
            <div class="space-y-4">
                <img
                    v-if="previewProduct?.image_url && !imageLoadFailed[previewProduct.uuid]"
                    :src="previewProduct.image_url"
                    class="max-h-[50vh] w-full rounded-lg object-contain"
                    :alt="previewProduct.name"
                    @error="onImageError(previewProduct!.uuid)"
                >
                <div v-else class="flex h-40 items-center justify-center rounded-lg bg-elevated text-dimmed">
                    <UIcon name="i-lucide-image-off" class="size-8" />
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge
                        :color="previewProduct?.is_active ? 'success' : 'neutral'"
                        :label="previewProduct?.is_active ? 'Active' : 'Inactive'"
                    />
                    <span class="text-sm text-muted">{{ previewProduct?.category?.name ?? '-' }}</span>
                    <span v-if="previewProduct?.brand" class="inline-flex items-center gap-1 text-sm text-muted">
                        ·
                        <img v-if="previewProduct.brand.logo_url" :src="previewProduct.brand.logo_url" class="size-4 rounded object-contain" alt="">
                        {{ previewProduct.brand.name }}
                    </span>
                </div>

                <p class="text-xl font-semibold text-highlighted">₱{{ previewProduct?.default_price }}</p>

                <p v-if="previewProduct?.description" class="text-sm text-muted">{{ previewProduct.description }}</p>
            </div>
        </BaseModal>

        <BaseModal
            v-model:open="isCategoryModalOpen"
            :title="editingCategory ? 'Edit Category' : 'Add Category'"
            show-default-footer
            form-id="category-form"
            :confirm-label="editingCategory ? 'Save' : 'Create'"
            :loading="savingCategory"
        >
            <form id="category-form" class="space-y-4" @submit.prevent="onSaveCategory">
                <UFormField label="Name" required>
                    <UInput v-model="categoryForm.name" placeholder="Appliances" class="w-full" />
                </UFormField>
                <UFormField label="Description">
                    <UTextarea v-model="categoryForm.description" placeholder="Short category description" class="w-full" />
                </UFormField>
                <UFormField label="Active">
                    <UCheckbox v-model="categoryForm.is_active" label="Category is active" />
                </UFormField>
            </form>
        </BaseModal>

        <BaseModal
            v-model:open="isBrandModalOpen"
            :title="editingBrand ? 'Edit Brand' : 'Add Brand'"
            show-default-footer
            form-id="brand-form"
            :confirm-label="editingBrand ? 'Save' : 'Create'"
            :loading="savingBrand"
        >
            <form id="brand-form" class="space-y-4" @submit.prevent="onSaveBrand">
                <div class="flex items-center gap-3">
                    <img
                        v-if="brandForm.logo_url && !brandLogoPreviewFailed"
                        :src="brandForm.logo_url"
                        class="size-14 shrink-0 rounded-lg object-contain ring-1 ring-default bg-elevated"
                        alt=""
                        @error="brandLogoPreviewFailed = true"
                    >
                    <div v-else class="flex items-center justify-center size-14 shrink-0 rounded-lg bg-elevated text-dimmed">
                        <UIcon name="i-lucide-tag" class="size-5" />
                    </div>
                    <UFormField label="Logo URL" class="flex-1" hint="Optional">
                        <UInput
                            v-model="brandForm.logo_url"
                            placeholder="https://example.com/logo.png"
                            class="w-full"
                            @change="brandLogoPreviewFailed = false"
                        />
                    </UFormField>
                </div>
                <UFormField label="Name" required>
                    <UInput v-model="brandForm.name" placeholder="Nike" class="w-full" />
                </UFormField>
                <UFormField label="Active">
                    <UCheckbox v-model="brandForm.is_active" label="Brand is active" />
                </UFormField>
            </form>
        </BaseModal>

        <ConfirmDialogModal
            v-model:open="confirmDialog.open"
            :title="confirmDialog.title"
            :description="confirmDialog.description"
            :color="confirmDialog.color"
            :confirm-label="confirmDialog.confirmLabel"
            :loading="confirming"
            @confirm="confirmDialogAccept"
        />
    </div>
</template>

<script setup lang="ts">
import { productService } from '@/components/api/admin/ProductService'
import { productCategoryService } from '@/components/api/admin/ProductCategoryService'
import { brandService } from '@/components/api/admin/BrandService'
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'
import type { Category } from '@/types/Category'
import type { Brand } from '@/types/Brand'
import type { DropdownMenuItem, TableColumn, TabsItem } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Products' })

const toast = useToast()
const perPage = 15

const activeTab = ref<'products' | 'categories' | 'brands'>('products')

const tabs = computed<TabsItem[]>(() => [
    { label: 'Products', icon: 'i-lucide-package', value: 'products', slot: 'products' },
    { label: 'Categories', icon: 'i-lucide-tags', value: 'categories', slot: 'categories' },
    { label: 'Brands', icon: 'i-lucide-tag', value: 'brands', slot: 'brands' }
])

const { onTouchStart: onTabsTouchStart, onTouchMove: onTabsTouchMove, onTouchEnd: onTabsTouchEnd, panelEl } = useSwipeTabs(
    activeTab,
    computed(() => tabs.value.map((tab) => tab.value as 'products' | 'categories' | 'brands'))
)

// ---- Products ----

const products = ref<Product[]>([])
const { data: allCategories, ensure: ensureCategoriesLoaded } = useCachedFetch<Category[]>(
    'admin-product-categories',
    (etag) => productCategoryService.fetchCategoriesCacheable({ per_page: 200 }, etag)
)
const { data: allBrands, ensure: ensureBrandsLoaded } = useCachedFetch<Brand[]>(
    'admin-brands',
    (etag) => brandService.fetchBrandsCacheable({ per_page: 200 }, etag)
)
const productsLoading = ref(false)
const productsPage = ref(1)
const productsTotal = ref(0)
const productSearch = ref('')
const productCategoryFilter = ref('all')
const productBrandFilter = ref('all')
const productStatusFilter = ref('all')
const productSortByPrice = ref('none')
const productPriceMin = ref<number | null>(null)
const productPriceMax = ref<number | null>(null)
const isProductFiltersOpen = ref(false)

const productActiveFilterCount = computed(() =>
    [productBrandFilter.value !== 'all', productStatusFilter.value !== 'all', productSortByPrice.value !== 'none', productPriceMin.value !== null, productPriceMax.value !== null]
        .filter(Boolean).length
)

function clearProductFilters() {
    productBrandFilter.value = 'all'
    productStatusFilter.value = 'all'
    productSortByPrice.value = 'none'
    productPriceMin.value = null
    productPriceMax.value = null
}

const statusFilterOptions = [
    { label: 'All statuses', value: 'all' },
    { label: 'None', value: 'none' },
    { label: 'B1T1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' }
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

const isProductPreviewOpen = ref(false)
const previewProduct = ref<Product | null>(null)

function openProductPreview(product: Product) {
    previewProduct.value = product
    isProductPreviewOpen.value = true
}

const categoryOptions = computed(() => [
    { label: 'Uncategorized', value: null },
    ...(allCategories.value ?? []).map((category) => ({ label: category.name, value: category.uuid }))
])

const categoryFilterTabs = computed(() => [
    { label: 'All', value: 'all' },
    ...(allCategories.value ?? []).map((category) => ({ label: category.name, value: category.uuid }))
])

const brandOptions = computed(() => [
    { label: 'No brand', value: null },
    ...(allBrands.value ?? []).map((brand) => ({ label: brand.name, value: brand.uuid }))
])

const brandFilterOptions = computed(() => [
    { label: 'All brands', value: 'all' },
    ...(allBrands.value ?? []).map((brand) => ({ label: brand.name, value: brand.uuid }))
])

const productStatusOptions = [
    { label: 'None', value: 'none' },
    { label: 'B1T1', value: 'b1t1' },
    { label: 'Out of stock', value: 'out_of_stock' }
]

const productColumns: TableColumn<Product>[] = [
    { id: 'image', header: '' },
    { id: 'product', header: 'Product' },
    { id: 'category', header: 'Category' },
    { id: 'brand', header: 'Brand' },
    { id: 'default_price', header: 'Price' },
    { accessorKey: 'is_active', header: 'Status' },
    { id: 'actions', header: '' }
]

const productsEtag = ref<string | null>(null)

async function loadProducts() {
    productsLoading.value = true
    try {
        const result = await productService.fetchProductsCacheable({
            page: productsPage.value,
            per_page: perPage,
            search: productSearch.value || undefined,
            category_uuid: productCategoryFilter.value !== 'all' ? productCategoryFilter.value : undefined,
            brand_uuid: productBrandFilter.value !== 'all' ? productBrandFilter.value : undefined,
            status: productStatusFilter.value !== 'all' ? productStatusFilter.value : undefined,
            sort_by_price: productSortByPrice.value !== 'none' ? productSortByPrice.value : undefined,
            price_min: productPriceMin.value ?? undefined,
            price_max: productPriceMax.value ?? undefined
        }, productsEtag.value)
        if (result === 'not-modified') return
        products.value = result.data.items
        productsTotal.value = result.data.total
        productsEtag.value = result.etag
        productActionsCache.clear()
        imageLoadFailed.value = {}
    } catch (error) {
        toast.add({ title: 'Failed to load products', description: (error as APIError).message, color: 'error' })
    } finally {
        productsLoading.value = false
    }
}

watch(productsPage, loadProducts)

watch([productCategoryFilter, productBrandFilter, productStatusFilter, productSortByPrice], () => {
    productsPage.value = 1
    loadProducts()
})

useSearchDebounce(productSearch, () => {
    productsPage.value = 1
    loadProducts()
})

let priceRangeDebounce: ReturnType<typeof setTimeout>
watch([productPriceMin, productPriceMax], () => {
    clearTimeout(priceRangeDebounce)
    priceRangeDebounce = setTimeout(() => {
        productsPage.value = 1
        loadProducts()
    }, 300)
})

const isProductModalOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const productForm = reactive({
    name: '',
    description: '',
    is_active: true,
    default_price: null as number | null,
    default_product_status: 'none' as 'none' | 'b1t1' | 'out_of_stock',
    category_id: null as string | null,
    brand_id: null as string | null,
    image: null as File | null
})
const savingProduct = ref(false)

const productImagePreviewUrl = ref<string | null>(null)

watch(
    [() => productForm.image, () => editingProduct.value],
    ([image, product], _old, onCleanup) => {
        if (image) {
            const url = URL.createObjectURL(image)
            productImagePreviewUrl.value = url
            onCleanup(() => URL.revokeObjectURL(url))
            return
        }
        productImagePreviewUrl.value = product?.image_url ?? null
    },
    { immediate: true }
)

function openProductCreateModal() {
    editingProduct.value = null
    productForm.name = ''
    productForm.description = ''
    productForm.is_active = true
    productForm.default_price = null
    productForm.default_product_status = 'none'
    productForm.category_id = null
    productForm.brand_id = null
    productForm.image = null
    isProductModalOpen.value = true
}

function openProductEditModal(product: Product) {
    editingProduct.value = product
    productForm.name = product.name
    productForm.description = product.description ?? ''
    productForm.is_active = product.is_active
    productForm.default_price = Number(product.default_price)
    productForm.default_product_status = product.default_product_status
    productForm.category_id = product.category?.uuid ?? null
    productForm.brand_id = product.brand?.uuid ?? null
    productForm.image = null
    isProductModalOpen.value = true
}

async function onSaveProduct() {
    savingProduct.value = true
    try {
        const payload = {
            name: productForm.name,
            description: productForm.description,
            is_active: productForm.is_active,
            default_price: productForm.default_price ?? 0,
            default_product_status: productForm.default_product_status,
            category_uuid: productForm.category_id,
            brand_uuid: productForm.brand_id,
            image: productForm.image
        }
        if (editingProduct.value) {
            await productService.updateProduct(editingProduct.value.uuid, payload)
            toast.add({ title: 'Product updated', color: 'success' })
        } else {
            await productService.createProduct(payload)
            toast.add({ title: 'Product created', color: 'success' })
        }
        isProductModalOpen.value = false
        await loadProducts()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingProduct.value = false
    }
}

const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

function onDeleteProduct(product: Product) {
    askConfirm({
        title: 'Delete product?',
        description: `Delete "${product.name}"?`,
        confirmLabel: 'Delete',
        color: 'error',
        action: async () => {
            await productService.deleteProduct(product.uuid)
            toast.add({ title: 'Product deleted', color: 'success' })
            await loadProducts()
        }
    })
}

const productActionsCache = new Map<string, DropdownMenuItem[]>()

function productActions(product: Product): DropdownMenuItem[] {
    const cached = productActionsCache.get(product.uuid)
    if (cached) return cached

    const actions: DropdownMenuItem[] = [
        { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openProductEditModal(product) },
        { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => onDeleteProduct(product) }
    ]
    productActionsCache.set(product.uuid, actions)
    return actions
}

// ---- Categories ----

const categoriesLoading = ref(false)
const categories = ref<Category[]>([])
const categoriesPage = ref(1)
const categoriesTotal = ref(0)
const categorySearch = ref('')

const categoryColumns: TableColumn<Category>[] = [
    { id: 'category', header: 'Category' },
    { accessorKey: 'is_active', header: 'Status' },
    { id: 'actions', header: '' }
]

async function loadCategories() {
    categoriesLoading.value = true
    try {
        const response = await productCategoryService.fetchCategories({ page: categoriesPage.value, per_page: perPage, search: categorySearch.value || undefined })
        categories.value = response.data.items
        categoriesTotal.value = response.data.total
        categoryActionsCache.clear()
    } catch (error) {
        toast.add({ title: 'Failed to load categories', description: (error as APIError).message, color: 'error' })
    } finally {
        categoriesLoading.value = false
    }
}

watch(categoriesPage, loadCategories)

useSearchDebounce(categorySearch, () => {
    categoriesPage.value = 1
    loadCategories()
})

const isCategoryModalOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const categoryForm = reactive({
    name: '',
    description: '',
    is_active: true
})
const savingCategory = ref(false)

function openCategoryCreateModal() {
    editingCategory.value = null
    categoryForm.name = ''
    categoryForm.description = ''
    categoryForm.is_active = true
    isCategoryModalOpen.value = true
}

function openCategoryEditModal(category: Category) {
    editingCategory.value = category
    categoryForm.name = category.name
    categoryForm.description = category.description ?? ''
    categoryForm.is_active = category.is_active
    isCategoryModalOpen.value = true
}

async function onSaveCategory() {
    savingCategory.value = true
    try {
        const payload = {
            name: categoryForm.name,
            description: categoryForm.description,
            is_active: categoryForm.is_active
        }
        if (editingCategory.value) {
            const response = await productCategoryService.updateCategory(editingCategory.value.uuid, payload)
            const categories = allCategories.value ?? []
            const index = categories.findIndex((category) => category.uuid === response.data.uuid)
            if (index !== -1) categories[index] = response.data
            allCategories.value = categories
            toast.add({ title: 'Category updated', color: 'success' })
        } else {
            const response = await productCategoryService.createCategory(payload)
            allCategories.value = [...(allCategories.value ?? []), response.data]
            toast.add({ title: 'Category created', color: 'success' })
        }
        isCategoryModalOpen.value = false
        await loadCategories()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingCategory.value = false
    }
}

function onDeleteCategory(category: Category) {
    askConfirm({
        title: 'Delete category?',
        description: `Delete "${category.name}"?`,
        confirmLabel: 'Delete',
        color: 'error',
        action: async () => {
            await productCategoryService.deleteCategory(category.uuid)
            allCategories.value = (allCategories.value ?? []).filter((item) => item.uuid !== category.uuid)
            toast.add({ title: 'Category deleted', color: 'success' })
            await loadCategories()
        }
    })
}

function viewCategoryProducts(category: Category) {
    productCategoryFilter.value = category.uuid
    activeTab.value = 'products'
}

const categoryActionsCache = new Map<string, DropdownMenuItem[]>()

function categoryActions(category: Category): DropdownMenuItem[] {
    const cached = categoryActionsCache.get(category.uuid)
    if (cached) return cached

    const actions: DropdownMenuItem[] = [
        { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openCategoryEditModal(category) },
        { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => onDeleteCategory(category) }
    ]
    categoryActionsCache.set(category.uuid, actions)
    return actions
}

// ---- Brands ----

const brandsLoading = ref(false)
const brands = ref<Brand[]>([])
const brandsPage = ref(1)
const brandsTotal = ref(0)
const brandSearch = ref('')

const brandColumns: TableColumn<Brand>[] = [
    { id: 'logo', header: '' },
    { id: 'brand', header: 'Brand' },
    { accessorKey: 'is_active', header: 'Status' },
    { id: 'actions', header: '' }
]

const brandLogoLoadFailed = ref<Record<string, boolean>>({})

function onBrandLogoError(brandUuid: string) {
    brandLogoLoadFailed.value[brandUuid] = true
}

async function loadBrands() {
    brandsLoading.value = true
    try {
        const response = await brandService.fetchBrands({ page: brandsPage.value, per_page: perPage, search: brandSearch.value || undefined })
        brands.value = response.data.items
        brandsTotal.value = response.data.total
        brandActionsCache.clear()
        brandLogoLoadFailed.value = {}
    } catch (error) {
        toast.add({ title: 'Failed to load brands', description: (error as APIError).message, color: 'error' })
    } finally {
        brandsLoading.value = false
    }
}

watch(brandsPage, loadBrands)

useSearchDebounce(brandSearch, () => {
    brandsPage.value = 1
    loadBrands()
})

const isBrandModalOpen = ref(false)
const editingBrand = ref<Brand | null>(null)
const brandForm = reactive({
    name: '',
    logo_url: '',
    is_active: true
})
const brandLogoPreviewFailed = ref(false)
const savingBrand = ref(false)

function openBrandCreateModal() {
    editingBrand.value = null
    brandForm.name = ''
    brandForm.logo_url = ''
    brandForm.is_active = true
    brandLogoPreviewFailed.value = false
    isBrandModalOpen.value = true
}

function openBrandEditModal(brand: Brand) {
    editingBrand.value = brand
    brandForm.name = brand.name
    brandForm.logo_url = brand.logo_url ?? ''
    brandForm.is_active = brand.is_active
    brandLogoPreviewFailed.value = false
    isBrandModalOpen.value = true
}

async function onSaveBrand() {
    savingBrand.value = true
    try {
        const payload = {
            name: brandForm.name,
            logo_url: brandForm.logo_url || null,
            is_active: brandForm.is_active
        }
        if (editingBrand.value) {
            const response = await brandService.updateBrand(editingBrand.value.uuid, payload)
            const brandList = allBrands.value ?? []
            const index = brandList.findIndex((brand) => brand.uuid === response.data.uuid)
            if (index !== -1) brandList[index] = response.data
            allBrands.value = brandList
            toast.add({ title: 'Brand updated', color: 'success' })
        } else {
            const response = await brandService.createBrand(payload)
            allBrands.value = [...(allBrands.value ?? []), response.data]
            toast.add({ title: 'Brand created', color: 'success' })
        }
        isBrandModalOpen.value = false
        await loadBrands()
    } catch (error) {
        toast.add({ title: 'Save failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingBrand.value = false
    }
}

function onDeleteBrand(brand: Brand) {
    askConfirm({
        title: 'Delete brand?',
        description: `Delete "${brand.name}"?`,
        confirmLabel: 'Delete',
        color: 'error',
        action: async () => {
            await brandService.deleteBrand(brand.uuid)
            allBrands.value = (allBrands.value ?? []).filter((item) => item.uuid !== brand.uuid)
            toast.add({ title: 'Brand deleted', color: 'success' })
            await loadBrands()
        }
    })
}

const brandActionsCache = new Map<string, DropdownMenuItem[]>()

function brandActions(brand: Brand): DropdownMenuItem[] {
    const cached = brandActionsCache.get(brand.uuid)
    if (cached) return cached

    const actions: DropdownMenuItem[] = [
        { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openBrandEditModal(brand) },
        { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => onDeleteBrand(brand) }
    ]
    brandActionsCache.set(brand.uuid, actions)
    return actions
}

onMounted(() => {
    ensureCategoriesLoaded().catch((error) => {
        toast.add({ title: 'Failed to load categories', description: (error as APIError).message, color: 'error' })
    })
    ensureBrandsLoaded().catch((error) => {
        toast.add({ title: 'Failed to load brands', description: (error as APIError).message, color: 'error' })
    })
    loadProducts()
    loadCategories()
    loadBrands()
})

onPullToRefresh(() => Promise.all([ensureCategoriesLoaded(true), ensureBrandsLoaded(true), loadProducts(), loadCategories(), loadBrands()]))
</script>
