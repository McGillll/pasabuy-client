<template>
    <UInput
        v-model="innerModel"
        :model-modifiers="modelModifiers"
        :type="type"
        :placeholder="placeholder"
        :icon="icon"
        :trailing-icon="trailingIcon"
        :size="size"
        :color="color"
        :variant="variant"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :class="class"
        :ui="mergedUi"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UInput>
</template>

<script setup lang="ts">
import type { InputProps } from '@nuxt/ui'

const props = withDefaults(defineProps<{
    type?: string
    placeholder?: string
    icon?: string
    trailingIcon?: string
    size?: InputProps['size']
    color?: InputProps['color']
    variant?: InputProps['variant']
    disabled?: boolean
    autocomplete?: string
    class?: string
    ui?: InputProps['ui']
}>(), {
    type: 'text',
    size: 'md',
    disabled: false,
    class: 'w-full'
})

const [model, modelModifiers] = defineModel<string | number | null>()

const innerModel = computed({
    get: () => model.value ?? undefined,
    set: (value) => { model.value = value ?? null }
})

const mergedUi = computed(() => ({ base: 'h-11', ...(props.ui ?? {}) }))
</script>
