<template>
    <BaseModal
        :open="open"
        :title="title"
        size="sm"
        show-default-footer
        :confirm-label="confirmLabel"
        :confirm-color="color"
        :loading="loading"
        @update:open="(value: boolean) => emit('update:open', value)"
        @confirm="emit('confirm')"
    >
        <p class="text-sm text-muted">{{ description }}</p>
    </BaseModal>
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
