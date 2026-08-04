<template>
    <BaseList
        :items="items"
        :loading="loading"
        empty-icon="i-lucide-package-search"
        empty-message="No products found."
    >
        <template #item="{ item }">
            <BaseListItemCard
                :name="item.name"
                :meta="metaFor(item)"
                :price="`₱${item.default_price}`"
                :image-url="item.image_url"
                :inactive="!item.is_active"
                :status-icon="statusIconFor(item)"
                :status-icon-class="statusIconClassFor(item)"
                :status-label="statusLabelFor(item)"
                @click="openSheet(item)"
            />
        </template>
    </BaseList>

    <BaseActionSheet
        v-model:open="sheetOpen"
        :title="selected?.name"
        :description="selected ? metaFor(selected) : undefined"
        :actions="sheetActions"
    />
</template>

<script setup lang="ts">
import type { Product } from '@/types/Product'

const props = withDefaults(defineProps<{
    items: Product[]
    loading?: boolean
    activeCategoryUuid?: string
}>(), {
    activeCategoryUuid: 'all'
})

const emit = defineEmits<{
    edit: [product: Product]
    delete: [product: Product]
}>()

function metaFor(product: Product) {
    const parts: string[] = []
    const categoryIsActiveFilter = props.activeCategoryUuid !== 'all' && product.category?.uuid === props.activeCategoryUuid
    if (product.category && !categoryIsActiveFilter) parts.push(product.category.name)
    return parts.join(' · ')
}

const { productStatusIcon, productStatusIconClass, productStatusLabel } = useProductStatus()

function statusIconFor(product: Product) {
    if (product.default_product_status === 'none') return undefined
    return productStatusIcon[product.default_product_status]
}

function statusIconClassFor(product: Product) {
    if (product.default_product_status === 'none') return undefined
    return productStatusIconClass[product.default_product_status]
}

function statusLabelFor(product: Product) {
    if (product.default_product_status === 'none') return undefined
    return productStatusLabel[product.default_product_status]
}

const sheetOpen = ref(false)
const selected = ref<Product | null>(null)

function openSheet(product: Product) {
    selected.value = product
    sheetOpen.value = true
}

const sheetActions = computed(() => selected.value
    ? [
        { label: 'Edit product', icon: 'i-lucide-pencil', onSelect: () => emit('edit', selected.value!) },
        { label: 'Delete product', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => emit('delete', selected.value!) }
    ]
    : [])
</script>
