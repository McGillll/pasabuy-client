<template>
    <BaseButton color="error" variant="ghost" size="sm" @click="open = true">
        Cancel order
    </BaseButton>

    <BaseConfirmModal
        v-model:open="open"
        title="Cancel order?"
        description="This cannot be undone."
        confirm-label="Yes, cancel"
        color="error"
        :loading="loading"
        @confirm="emit('confirm')"
    />
</template>

<script setup lang="ts">
defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const open = ref(false)
</script>
