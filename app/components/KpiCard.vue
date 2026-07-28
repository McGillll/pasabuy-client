<template>
    <BaseCard>
        <div class="flex items-center gap-3">
            <div class="flex items-center justify-center size-10 rounded-lg" :class="colorClasses">
                <UIcon :name="icon" class="size-5" />
            </div>
            <div>
                <p class="text-xs text-muted">{{ label }}</p>
                <p class="font-mono tabular-nums text-2xl font-semibold text-highlighted">{{ value }}</p>
                <p v-if="delta" class="text-xs text-dimmed mt-0.5">{{ delta }}</p>
            </div>
        </div>
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
}>(), {
    color: 'primary'
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
