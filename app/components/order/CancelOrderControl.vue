<template>
    <BaseButton color="error" variant="ghost" size="sm" @click="open = true">
        Cancel order
    </BaseButton>

    <BaseConfirmModal
        v-model:open="open"
        title="Cancel order?"
        :description="description"
        confirm-label="Yes, cancel"
        color="error"
        :loading="loading"
        @confirm="emit('confirm')"
    />
</template>

<script setup lang="ts">
const props = defineProps<{
    loading?: boolean
    orderTitle?: string
    orderTotal?: string | number
}>()

const emit = defineEmits<{ confirm: [] }>()

const open = ref(false)

const description = computed(() => {
    if (props.orderTitle && props.orderTotal) {
        return `Canceling ${props.orderTitle} (₱${formatNumber(props.orderTotal)}) cannot be undone.`
    }

    return 'This cannot be undone.'
})
</script>
