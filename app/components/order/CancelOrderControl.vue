<template>
    <template v-if="!confirming">
        <BaseButton color="error" variant="ghost" size="sm" @click="() => { confirming = true }">
            Cancel order
        </BaseButton>
    </template>
    <template v-else>
        <span class="text-sm text-muted">Are you sure?</span>
        <BaseButton color="error" :loading="loading" @click="() => emit('confirm')">
            Yes, cancel
        </BaseButton>
        <BaseButton color="neutral" variant="soft" @click="() => { confirming = false }">
            No
        </BaseButton>
    </template>
</template>

<script setup lang="ts">
defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const confirming = ref(false)
</script>
