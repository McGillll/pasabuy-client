<template>
    <BaseCard>
        <Transition
            enter-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-150"
            leave-to-class="opacity-0"
            mode="out-in"
        >
            <div v-if="loading" class="flex items-center gap-3">
                <USkeleton class="size-10 shrink-0 rounded-lg" />
                <div class="flex-1 space-y-1.5">
                    <USkeleton class="h-3 w-2/3" />
                    <USkeleton class="h-6 w-1/2" />
                </div>
            </div>
            <div v-else class="flex items-center gap-3">
                <div class="flex items-center justify-center size-10 rounded-lg" :class="colorClasses">
                    <UIcon :name="icon" class="size-5" />
                </div>
                <div>
                    <p class="flex items-center gap-1 text-xs text-muted">
                        {{ label }}
                        <BaseHelpTooltip v-if="tooltip">{{ tooltip }}</BaseHelpTooltip>
                    </p>
                    <p class="font-mono tabular-nums text-2xl font-semibold text-highlighted">{{ value }}</p>
                    <p v-if="delta" class="text-xs text-dimmed mt-0.5">{{ delta }}</p>
                </div>
            </div>
        </Transition>
    </BaseCard>
</template>

<script setup lang="ts">
export type KpiCardColor = 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral'

const props = withDefaults(defineProps<{
    icon: string
    color?: KpiCardColor
    label: string
    value: string | number
    delta?: string
    tooltip?: string
    loading?: boolean
}>(), {
    color: 'primary',
    loading: false
})

const colorClassMap: Record<KpiCardColor, string> = {
    primary: 'bg-primary/10 text-primary',
    info: 'bg-info/10 text-info',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    neutral: 'bg-elevated text-muted'
}

const colorClasses = computed(() => colorClassMap[props.color])
</script>
