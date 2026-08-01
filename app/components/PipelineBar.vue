<template>
    <BaseCard>
        <template #header>
            <p class="text-sm font-medium text-highlighted">{{ title }}</p>
        </template>

        <div v-if="loading" class="space-y-4">
            <USkeleton class="h-2 w-full rounded-full" />
            <div class="grid grid-cols-3 gap-2">
                <div v-for="n in 3" :key="n" class="space-y-1.5">
                    <USkeleton class="h-3 w-3/4" />
                    <USkeleton class="h-4 w-1/2" />
                </div>
            </div>
        </div>
        <p v-else-if="total === 0" class="text-sm text-muted">
            No order data yet
        </p>
        <div v-else>
            <BaseProgressBar
                :segments="stages.map((stage) => ({ value: stage.count, color: stage.color }))"
                size="md"
            />
            <div class="grid grid-cols-3 gap-2 mt-4">
                <div v-for="stage in stagesWithPct" :key="stage.label" class="flex flex-col gap-0.5">
                    <div class="flex items-center gap-1.5">
                        <span class="inline-block size-2 rounded-sm" :class="stage.color ?? 'bg-primary'" />
                        <span class="text-xs text-muted truncate">{{ stage.label }}</span>
                    </div>
                    <div class="flex items-baseline gap-1">
                        <span class="text-sm font-semibold text-highlighted">{{ stage.count }}</span>
                        <span class="text-xs text-dimmed">{{ stage.pct }}%</span>
                    </div>
                </div>
            </div>
        </div>
    </BaseCard>
</template>

<script setup lang="ts">
export type PipelineStage = {
    label: string
    count: number
    color?: string
}

const props = withDefaults(defineProps<{
    title: string
    stages: PipelineStage[]
    loading?: boolean
}>(), {
    loading: false
})

const total = computed(() => props.stages.reduce((sum, stage) => sum + stage.count, 0))

const stagesWithPct = computed(() => props.stages.map((stage) => ({
    ...stage,
    pct: total.value > 0 ? Math.round((stage.count / total.value) * 100) : 0
})))
</script>
