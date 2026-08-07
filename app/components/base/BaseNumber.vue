<template>
    <span><slot name="prefix">{{ prefix }}</slot>{{ formattedValue }}<slot name="suffix">{{ suffix }}</slot></span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    value: number | string | null | undefined
    prefix?: string
    suffix?: string
    maximumFractionDigits?: number
}>(), {
    prefix: '',
    suffix: '',
    maximumFractionDigits: 2
})

const formattedValue = computed(() => formatNumber(props.value, props.maximumFractionDigits))
</script>
