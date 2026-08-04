<template>
    <UTabs
        :model-value="modelValue"
        :items="items"
        :variant="resolvedVariant"
        :size="size"
        :ui="mergedUi"
        :class="class"
        @update:model-value="(value) => emit('update:modelValue', value as string)"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UTabs>
</template>

<script setup lang="ts">
import type { TabsItem, TabsProps } from '@nuxt/ui'

const props = withDefaults(defineProps<{
    items: TabsItem[]
    modelValue?: string
    variant?: TabsProps['variant']
    size?: TabsProps['size']
    ui?: TabsProps['ui']
    scrollable?: boolean
    class?: string
}>(), {
    scrollable: false
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const SCROLLABLE_UI: TabsProps['ui'] = {
    list: 'flex-nowrap overflow-x-auto',
    trigger: 'grow-0 shrink-0 min-w-20 justify-center py-2.5'
}

const mergedUi = computed<TabsProps['ui']>(() => (
    props.scrollable ? { ...SCROLLABLE_UI, ...props.ui } : props.ui
))

const resolvedVariant = computed<TabsProps['variant']>(() => props.variant ?? (props.scrollable ? 'pill' : undefined))
</script>
