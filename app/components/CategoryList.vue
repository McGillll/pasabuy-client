<template>
    <BaseList
        :items="items"
        :loading="loading"
        empty-icon="i-lucide-tags"
        empty-message="No categories found."
    >
        <template #item="{ item }">
            <BaseListItemCard
                :name="item.name"
                :meta="item.description ?? undefined"
                :image-url="item.image_url"
                icon="i-lucide-tag"
                :inactive="!item.is_active"
                @click="openSheet(item)"
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

defineProps<{
    items: Category[]
    loading?: boolean
}>()

const emit = defineEmits<{
    view: [category: Category]
    edit: [category: Category]
    delete: [category: Category]
}>()

const sheetOpen = ref(false)
const selected = ref<Category | null>(null)

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
