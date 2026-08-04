<template>
    <UFormField
        :label="label"
        :name="name"
        :description="description"
        :hint="hint"
        :help="help"
        :error="error"
        :required="required"
        :size="size"
        :class="class"
        :ui="ui"
    >
        <template #default="{ error: fieldError }">
            <slot :error="fieldError" />
            <span v-if="fieldError" class="sr-only" role="alert">{{ fieldError }}</span>
        </template>
        <template v-for="name in namedSlots" :key="name" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UFormField>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'
import type { FormFieldProps } from '@nuxt/ui'

withDefaults(defineProps<{
    label?: string
    name?: string
    description?: string
    hint?: string
    help?: string
    error?: FormFieldProps['error']
    required?: boolean
    size?: FormFieldProps['size']
    class?: string
    ui?: FormFieldProps['ui']
}>(), {
    error: undefined
})

const namedSlots = computed(() => Object.keys(useSlots()).filter(slotName => slotName !== 'default'))
</script>
