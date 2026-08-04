<template>
    <div class="flex flex-wrap gap-2">
        <button
            v-for="option in items"
            :key="option.value"
            type="button"
            class="min-h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors"
            :class="option.value === model ? 'bg-primary text-inverted' : 'bg-elevated text-muted hover:text-highlighted'"
            @click="model = option.value"
        >
            {{ option.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
interface ChipGroupOption {
    label: string
    value: string
}

defineProps<{
    items: ChipGroupOption[]
}>()

const model = defineModel<string>({ default: '' })
</script>
