<template>
    <template v-if="!confirming">
        <UButton color="error" variant="ghost" size="sm" @click="() => { confirming = true }">
            Cancel order
        </UButton>
    </template>
    <template v-else>
        <span class="text-sm text-muted">Are you sure?</span>
        <UButton color="error" :loading="loading" @click="() => emit('confirm')">
            Yes, cancel
        </UButton>
        <UButton color="neutral" variant="soft" @click="() => { confirming = false }">
            No
        </UButton>
    </template>
</template>

<script setup lang="ts">
defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{ confirm: [] }>()

const confirming = ref(false)
</script>
