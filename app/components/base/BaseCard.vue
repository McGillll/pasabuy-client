<template>
    <UCard variant="outline" :ui="mergedUi">
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UCard>
</template>

<script setup lang="ts">
import type { CardProps } from '@nuxt/ui'

const props = withDefaults(defineProps<{
    ui?: CardProps['ui']
}>(), {
    ui: undefined
})

const FIXED_ROOT = 'rounded-xl ring ring-default shadow-sm'
const FIXED_HEADER = 'border-b border-default'
const FIXED_FOOTER = 'border-t border-default'

const mergedUi = computed<CardProps['ui']>(() => ({
    ...props.ui,
    root: `${FIXED_ROOT} ${props.ui?.root ?? ''}`,
    header: `${FIXED_HEADER} ${props.ui?.header ?? ''}`,
    footer: `${FIXED_FOOTER} ${props.ui?.footer ?? ''}`
}))
</script>
