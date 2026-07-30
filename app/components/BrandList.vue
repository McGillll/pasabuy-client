<template>
    <BaseList
        :items="items"
        :loading="loading"
        empty-icon="i-lucide-tag"
        empty-message="No brands found."
    >
        <template #item="{ item }">
            <BaseListItemCard
                :name="item.name"
                :image-url="item.logo_url"
                icon="i-lucide-tag"
                :inactive="!item.is_active"
                @click="openSheet(item)"
            />
        </template>
    </BaseList>

    <BaseActionSheet
        v-model:open="sheetOpen"
        :title="selected?.name"
        :actions="sheetActions"
    />
</template>

<script setup lang="ts">
import type { Brand } from '@/types/Brand'

defineProps<{
    items: Brand[]
    loading?: boolean
}>()

const emit = defineEmits<{
    edit: [brand: Brand]
    delete: [brand: Brand]
}>()

const sheetOpen = ref(false)
const selected = ref<Brand | null>(null)

function openSheet(brand: Brand) {
    selected.value = brand
    sheetOpen.value = true
}

const sheetActions = computed(() => selected.value
    ? [
        { label: 'Edit brand', icon: 'i-lucide-pencil', onSelect: () => emit('edit', selected.value!) },
        { label: 'Delete brand', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => emit('delete', selected.value!) }
    ]
    : [])
</script>
