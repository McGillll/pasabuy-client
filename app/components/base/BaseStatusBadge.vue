<template>
    <UBadge :color="color" variant="subtle" :size="size">
        <span class="flex items-center gap-1.5">
            <span v-if="dot" class="size-1.5 rounded-full bg-current" />
            {{ label }}
        </span>
    </UBadge>
</template>

<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

withDefaults(defineProps<{
    color: BadgeProps['color']
    label: string
    dot?: boolean
    size?: BadgeProps['size']
}>(), {
    dot: false
})
</script>
