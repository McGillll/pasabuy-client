<template>
    <div class="grid grid-cols-2 gap-3 sm:gap-4">
        <KpiCard v-for="item in items" :key="item.label" v-bind="item" :loading="loading" />
    </div>
</template>

<script setup lang="ts">
import type { KpiCardColor } from '@/components/KpiCard.vue'

export interface KpiStripItem {
    icon: string
    color?: KpiCardColor
    label: string
    value: string | number
    delta?: string
    tooltip?: string
}

withDefaults(defineProps<{
    items: KpiStripItem[]
    loading?: boolean
}>(), {
    loading: false
})
</script>
