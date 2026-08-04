<template>
    <div
        class="inline-flex shrink-0 items-center justify-center rounded-lg font-semibold select-none"
        :class="[sizeClasses, colorClasses]"
    >
        {{ initials }}
    </div>
</template>

<script setup lang="ts">
interface Props {
    name: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
    size: 'md'
})

const sizeMap = {
    sm: 'h-[26px] w-[26px] text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
    xl: 'h-16 w-16 text-lg'
}

const colorPalette = [
    'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
]

const sizeClasses = computed(() => sizeMap[props.size])

const initials = computed(() => {
    const words = props.name.trim().split(/\s+/).filter(Boolean)

    if (words.length === 0) {
        return '?'
    }

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase()
    }

    return (words[0][0] + words[1][0]).toUpperCase()
})

const colorClasses = computed(() => {
    const trimmed = props.name.trim()

    if (!trimmed) {
        return colorPalette[0]
    }

    let hash = 0

    for (let i = 0; i < trimmed.length; i++) {
        hash = (hash << 5) - hash + trimmed.charCodeAt(i)
        hash |= 0
    }

    const index = Math.abs(hash) % colorPalette.length

    return colorPalette[index]
})
</script>
