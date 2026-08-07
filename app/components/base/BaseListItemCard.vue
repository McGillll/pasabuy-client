<template>
    <div
        class="min-h-11 rounded-xl ring ring-default shadow-sm bg-default cursor-pointer transition-opacity"
        :class="inactive ? 'opacity-40' : ''"
        role="button"
        tabindex="0"
        @click="emit('click')"
        @keydown.enter="emit('click')"
        @keydown.space.prevent="emit('click')"
    >
        <div class="flex items-center gap-3 p-3">
            <div class="relative shrink-0">
                <div class="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-elevated ring-1 ring-default text-dimmed">
                    <img v-if="imageUrl" :src="imageUrl" loading="lazy" class="size-full object-cover" alt="">
                    <UIcon v-else :name="icon" class="size-4" />
                </div>
                <span
                    v-if="statusIcon"
                    class="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full ring-2 ring-default"
                    :class="statusIconClass"
                >
                    <UIcon :name="statusIcon" class="size-2.5" />
                    <span class="sr-only">{{ statusLabel }}</span>
                </span>
            </div>

            <div class="min-w-0 flex-1">
                <p class="truncate font-medium text-highlighted">
                    {{ name }}
                    <span v-if="inactive" class="sr-only">(Inactive)</span>
                </p>
                <p v-if="meta" class="truncate text-xs text-muted">{{ meta }}</p>
            </div>

            <span v-if="$slots.price || price" class="shrink-0 font-semibold text-highlighted">
                <slot name="price">{{ price }}</slot>
            </span>
            <UIcon v-else name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
        </div>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    name: string
    meta?: string
    price?: string
    imageUrl?: string | null
    icon?: string
    inactive?: boolean
    statusIcon?: string
    statusIconClass?: string
    statusLabel?: string
}>(), {
    icon: 'i-lucide-package',
    inactive: false
})

const emit = defineEmits<{
    click: []
}>()
</script>
