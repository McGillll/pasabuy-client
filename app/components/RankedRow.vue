<template>
    <div class="flex items-center gap-3 py-2.5 border-b border-default last:border-b-0">
        <span
            class="w-5 text-center text-xs font-bold"
            :class="rank === 1 ? 'text-primary' : 'text-dimmed'"
        >
            {{ rank }}
        </span>

        <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ name }}</p>
            <BaseProgressBar
                class="mt-1.5"
                :segments="[{ value: progressPct }]"
                :max="100"
                size="sm"
            />
        </div>

        <div class="text-right shrink-0">
            <p class="text-sm font-semibold">{{ qty }}</p>
            <p v-if="unit" class="text-[10px] text-dimmed">{{ unit }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    rank: number
    name: string
    progressPct: number
    qty: string | number
    unit?: string
}>()
</script>
