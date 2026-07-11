<template>
    <div
        class="flex w-full items-center gap-4 p-4 text-left"
        :class="[clickable ? 'cursor-pointer transition-colors hover:bg-elevated/50' : '', tone ? toneClasses[tone] : '', dimmed ? 'opacity-50' : '']"
        :role="clickable ? 'button' : undefined"
        :tabindex="clickable ? 0 : undefined"
        @click="clickable && emit('click')"
        @keydown.enter="clickable && emit('click')"
        @keydown.space.prevent="clickable && emit('click')"
    >
        <div v-if="$slots.leading" class="shrink-0">
            <slot name="leading" />
        </div>

        <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
                <slot name="title" />
            </div>
            <div v-if="$slots.subtitle" class="text-sm text-muted">
                <slot name="subtitle" />
            </div>
            <div v-if="$slots.meta" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <slot name="meta" />
            </div>
        </div>

        <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    clickable?: boolean
    tone?: 'error' | 'warning' | 'success' | 'neutral'
    dimmed?: boolean
}>()

const emit = defineEmits<{
    click: []
}>()

const toneClasses: Record<string, string> = {
    error: 'border-l-[3px] border-l-error',
    warning: 'border-l-[3px] border-l-warning',
    success: 'border-l-[3px] border-l-success',
    neutral: 'border-l-[3px] border-l-default'
}
</script>
