<template>
    <UFileUpload
        v-model="model"
        :accept="accept"
        :multiple="multiple"
        :class="class"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UFileUpload>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    accept?: string
    multiple?: boolean
    class?: string
}>(), {
    multiple: false
})

const model = defineModel<File | File[] | null>()
</script>
