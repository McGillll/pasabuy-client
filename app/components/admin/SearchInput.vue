<template>
    <UInput v-model="model" icon="i-lucide-search" :placeholder="placeholder" class="w-full sm:w-72" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    placeholder?: string
}>(), {
    placeholder: 'Search…'
})

const model = defineModel<string>({ default: '' })
</script>
