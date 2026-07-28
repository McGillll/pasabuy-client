<template>
    <div
        class="w-full overflow-hidden rounded-full"
        :class="[trackHeightClass, trackColor]"
    >
        <div class="flex h-full w-full">
            <div
                v-for="(segment, index) in renderedSegments"
                :key="index"
                class="h-full rounded-full"
                :class="segment.color ?? 'bg-primary'"
                :style="{ width: `${segment.width}%` }"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
interface ProgressSegment {
    value: number
    color?: string
}

const props = withDefaults(
    defineProps<{
        segments: ProgressSegment[]
        max?: number
        size?: 'sm' | 'md'
        trackColor?: string
    }>(),
    {
        max: undefined,
        size: 'sm',
        trackColor: 'bg-elevated'
    }
)

const trackHeightClass = computed(() => (props.size === 'md' ? 'h-2.5' : 'h-1.5'))

const renderedSegments = computed(() => {
    if (props.segments.length === 1 && props.max !== undefined) {
        const [segment] = props.segments
        const width = props.max > 0 ? Math.min(100, Math.max(0, (segment.value / props.max) * 100)) : 0

        return [{ color: segment.color, width }]
    }

    const total = props.segments.reduce((sum, segment) => sum + segment.value, 0)

    return props.segments.map((segment) => ({
        color: segment.color,
        width: total > 0 ? (segment.value / total) * 100 : 0
    }))
})
</script>
