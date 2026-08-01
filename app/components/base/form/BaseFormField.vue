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
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UFormField>
</template>

<script setup lang="ts">
import type { FormFieldProps } from '@nuxt/ui'

defineProps<{
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
}>()
</script>
