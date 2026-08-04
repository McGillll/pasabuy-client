<template>
    <UForm ref="formRef" :state="state" :schema="schema" :validate="validate" :validate-on="validateOn" :class="class" @submit="$emit('submit', $event)">
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

const formRef = useTemplateRef('formRef')

defineExpose({
    validate: (opts?: { name?: string | string[], silent?: boolean }) => formRef.value?.validate(opts)
})
</script>
