<template>
    <UForm :state="state" :schema="schema" :validate="validate" :validate-on="validateOn" :class="class" @submit="$emit('submit', $event)">
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent, FormError, FormInputEvents } from '@nuxt/ui'

defineProps<{
    state: object
    schema?: any
    validate?: (state: any) => Promise<FormError[]> | FormError[]
    validateOn?: FormInputEvents[]
    class?: string
}>()

defineEmits<{
    submit: [event: FormSubmitEvent<any>]
}>()
</script>
