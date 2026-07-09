<template>
    <div class="flex flex-col items-center gap-3" :class="padding">
        <UIcon :name="icon" class="size-8 text-dimmed" />
        <p class="text-sm text-muted">{{ message }}</p>
        <UButton v-if="actionLabel" size="sm" icon="i-lucide-plus" @click="emit('action')">
            {{ actionLabel }}
        </UButton>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    icon: string
    message: string
    actionLabel?: string
    padding?: string
}>(), {
    padding: 'py-10'
})

const emit = defineEmits<{ action: [] }>()
</script>
