<template>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard v-for="item in items" :key="item.label" v-bind="item" />
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
}

defineProps<{
    items: KpiStripItem[]
}>()
</script>
