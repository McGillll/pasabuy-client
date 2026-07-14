<template>
    <div
        class="w-full rounded-lg border border-default bg-default text-left"
        :class="[clickable ? 'cursor-pointer transition-colors hover:bg-elevated/50' : '', dimmed ? 'opacity-50' : '']"
        :role="clickable ? 'button' : undefined"
        :tabindex="clickable ? 0 : undefined"
        @click="clickable && emit('click')"
        @keydown.enter="clickable && emit('click')"
        @keydown.space.prevent="clickable && emit('click')"
    >
        <div class="flex items-center gap-4 p-4">
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

        <div v-if="$slots.status" class="flex flex-wrap items-center gap-2 border-t border-default px-4 py-2">
            <slot name="status" />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    clickable?: boolean
    dimmed?: boolean
}>()

const emit = defineEmits<{
    click: []
}>()
</script>
