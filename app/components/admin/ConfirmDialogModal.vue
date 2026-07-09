<template>
    <UModal :open="open" :title="title" @update:open="(value: boolean) => emit('update:open', value)">
        <template #body>
            <p class="text-sm text-muted">{{ description }}</p>
            <div class="mt-4 flex justify-end gap-2">
                <UButton color="neutral" variant="soft" @click="emit('update:open', false)">
                    Cancel
                </UButton>
                <UButton :color="color" :loading="loading" @click="emit('confirm')">
                    {{ confirmLabel }}
                </UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
defineProps<{
    open: boolean
    title: string
    description: string
    color?: 'primary' | 'success' | 'error'
    confirmLabel?: string
    loading?: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    confirm: []
}>()
</script>
