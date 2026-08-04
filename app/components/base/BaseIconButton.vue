<template>
    <UButton
        :icon="icon"
        :color="color"
        :variant="variant"
        :size="size"
        square
        :aria-label="ariaLabel"
        class="min-h-11 min-w-11 justify-center"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UButton>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

withDefaults(defineProps<{
    icon: string
    color?: ButtonProps['color']
    variant?: ButtonProps['variant']
    size?: ButtonProps['size']
    ariaLabel?: string
}>(), {
    color: 'neutral',
    variant: 'ghost',
    size: 'md'
})
</script>
