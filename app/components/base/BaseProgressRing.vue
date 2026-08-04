<template>
    <svg viewBox="0 0 44 44" class="shrink-0" :class="sizeClass" aria-hidden="true">
        <circle cx="22" cy="22" r="18" fill="none" stroke-width="5" stroke="currentColor" class="text-elevated" />
        <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke-width="5"
            stroke-linecap="round"
            stroke="currentColor"
            class="text-primary"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashoffset"
            transform="rotate(-90 22 22)"
        />
        <text x="22" y="26" text-anchor="middle" class="fill-current text-highlighted" style="font-size:11px;font-weight:700">
            {{ value }}/{{ max }}
        </text>
    </svg>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        value: number
        max: number
        size?: 'sm' | 'md'
    }>(),
    {
        size: 'md'
    }
)

const sizeClass = computed(() => (props.size === 'sm' ? 'size-8' : 'size-11'))

const circumference = 2 * Math.PI * 18

const progress = computed(() => (props.max > 0 ? Math.min(1, props.value / props.max) : 0))
const dashoffset = computed(() => circumference * (1 - progress.value))
</script>
