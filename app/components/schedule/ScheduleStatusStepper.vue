<template>
    <div class="flex items-center">
        <template v-for="(step, index) in steps" :key="step.value">
            <button
                type="button"
                class="flex flex-1 flex-col items-center gap-1.5"
                :disabled="step.disabled"
                :class="step.disabled ? 'cursor-not-allowed' : 'cursor-pointer'"
                @click="!step.disabled && emit('change', step.value)"
            >
                <span class="relative flex w-full items-center">
                    <span
                        v-if="index > 0"
                        class="absolute right-1/2 h-0.5 w-full -translate-y-1/2"
                        :class="steps[index - 1]!.state === 'done' ? 'bg-success' : 'bg-default'"
                    />
                    <span
                        class="relative z-10 mx-auto flex size-6 items-center justify-center rounded-full text-xs font-semibold ring-2"
                        :class="stepDotClass(step.state)"
                    >
                        <UIcon v-if="step.state === 'done'" name="i-lucide-check" class="size-3.5" />
                        <span v-else>{{ index + 1 }}</span>
                    </span>
                </span>
                <span class="text-xs font-medium" :class="step.state === 'upcoming' ? 'text-dimmed' : 'text-highlighted'">
                    {{ step.label }}
                </span>
            </button>
        </template>
    </div>
</template>

<script setup lang="ts">
type StepState = 'done' | 'current' | 'upcoming'

const props = defineProps<{
    status: 'open' | 'closed' | 'finished'
    canSetStatus: (target: string) => boolean
}>()

const emit = defineEmits<{
    change: [value: string]
}>()

const ORDER = ['open', 'closed', 'finished'] as const

const steps = computed(() => {
    const currentIndex = ORDER.indexOf(props.status)
    return ORDER.map((value, index) => ({
        value,
        label: value === 'open' ? 'Open' : value === 'closed' ? 'Closed' : 'Finished',
        state: (index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming') as StepState,
        disabled: !props.canSetStatus(value)
    }))
})

function stepDotClass(state: StepState) {
    if (state === 'done') return 'bg-success text-inverted ring-success'
    if (state === 'current') return 'bg-primary text-inverted ring-primary/30 ring-4'
    return 'bg-default text-dimmed ring-default'
}
</script>
