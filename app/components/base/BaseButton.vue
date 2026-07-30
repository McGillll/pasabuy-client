<template>
    <UButton
        :color="color"
        :variant="variant"
        :size="size"
        :block="block"
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
    color?: ButtonProps['color']
    variant?: ButtonProps['variant']
    size?: ButtonProps['size']
    block?: boolean
}>(), {
    color: 'primary',
    variant: 'solid',
    size: 'md',
    block: false
})
</script>
