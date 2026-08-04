<template>
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">{{ title }}</h1>
            <p v-if="subtitle" class="text-sm text-muted mt-1">{{ subtitle }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
            <BaseButton
                v-if="secondaryLabel"
                color="neutral"
                variant="outline"
                :icon="secondaryIcon"
                @click="emit('secondary-click')"
            >
                {{ secondaryLabel }}
            </BaseButton>
            <BaseButton
                v-if="primaryLabel"
                :icon="primaryIcon"
                @click="emit('primary-click')"
            >
                {{ primaryLabel }}
            </BaseButton>
        </div>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    title: string
    subtitle?: string
    primaryLabel?: string
    primaryIcon?: string
    secondaryLabel?: string
    secondaryIcon?: string
}>(), {
    primaryIcon: 'i-lucide-plus'
})

const emit = defineEmits<{
    'primary-click': []
    'secondary-click': []
}>()
</script>
