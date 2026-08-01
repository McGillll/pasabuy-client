<template>
    <UTextarea
        v-model="model"
        :placeholder="placeholder"
        :rows="rows"
        :size="size"
        :disabled="disabled"
        :class="class"
        :ui="ui"
        :autoresize="autoresize"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UTextarea>
</template>

<script setup lang="ts">
import type { TextareaProps } from '@nuxt/ui'

withDefaults(defineProps<{
    placeholder?: string
    rows?: number
    size?: TextareaProps['size']
    disabled?: boolean
    class?: string
    ui?: TextareaProps['ui']
    autoresize?: boolean
}>(), {
    rows: 3,
    disabled: false,
    class: 'w-full',
    autoresize: false
})

const model = defineModel<string>()
</script>
