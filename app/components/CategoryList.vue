<template>
    <BaseList
        :items="items"
        :loading="loading"
        empty-icon="i-lucide-tags"
        :empty-message="emptyMessage"
    >
        <template #item="{ item }">
            <BaseListItemCard
                :name="item.name"
                :meta="metaFor(item)"
                :image-url="item.image_url"
                icon="i-lucide-tag"
                :inactive="!item.is_active"
                @click="onItemClick(item)"
            />
        </template>
    </BaseList>

    <BaseActionSheet
        v-model:open="sheetOpen"
        :title="selected?.name"
        :description="selected?.description ?? undefined"
        :actions="sheetActions"
    />
</template>

<script setup lang="ts">
import type { Category } from '@/types/Category'

withDefaults(defineProps<{
    items: Category[]
    loading?: boolean
    emptyMessage?: string
}>(), {
    emptyMessage: 'No categories found.'
})

const emit = defineEmits<{
    view: [category: Category]
    drill: [category: Category]
    edit: [category: Category]
    delete: [category: Category]
}>()

const sheetOpen = ref(false)
const selected = ref<Category | null>(null)

function metaFor(category: Category) {
    if (category.has_children) return category.description ? `Subcategories · ${category.description}` : 'Subcategories'
    return category.description ?? undefined
}

function onItemClick(category: Category) {
    if (category.has_children) emit('drill', category)
    else openSheet(category)
}

function openSheet(category: Category) {
    selected.value = category
    sheetOpen.value = true
}

const sheetActions = computed(() => selected.value
    ? [
        { label: 'View products in this category', icon: 'i-lucide-eye', onSelect: () => emit('view', selected.value!) },
        { label: 'Edit category', icon: 'i-lucide-pencil', onSelect: () => emit('edit', selected.value!) },
        { label: 'Delete category', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => emit('delete', selected.value!) }
    ]
    : [])
</script>
