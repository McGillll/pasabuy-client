<template>
    <div v-if="password.length > 0" class="mt-2">
        <div class="flex gap-1">
            <span
                v-for="segment in 4"
                :key="segment"
                class="h-1 flex-1 rounded-full transition-colors"
                :class="segment <= score ? barColorClass : 'bg-elevated'"
            />
        </div>
        <div class="mt-2 flex flex-col gap-1.5 rounded-lg bg-elevated p-2.5">
            <div
                v-for="requirement in requirements"
                :key="requirement.label"
                class="flex items-center gap-2 text-xs"
                :class="requirement.met ? 'text-success' : 'text-dimmed'"
            >
                <UIcon :name="requirement.met ? 'i-lucide-check-circle-2' : 'i-lucide-circle'" class="size-3.5 shrink-0" />
                {{ requirement.label }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    password: string
    currentPassword?: string
}>()

const requirements = computed(() => {
    const list = [
        { label: 'At least 8 characters', met: props.password.length >= 8 },
        { label: 'Includes a number or symbol', met: /[0-9]/.test(props.password) || /[^a-zA-Z0-9]/.test(props.password) }
    ]

    if (props.currentPassword) {
        list.splice(1, 0, {
            label: 'Different from current password',
            met: props.password.length > 0 && props.password !== props.currentPassword
        })
    }

    return list
})

const score = computed(() => {
    let value = 0
    if (props.password.length >= 8) value++
    if (/[a-z]/.test(props.password) && /[A-Z]/.test(props.password)) value++
    if (/[0-9]/.test(props.password)) value++
    if (/[^a-zA-Z0-9]/.test(props.password) || props.password.length >= 12) value++
    return value
})

const barColorClass = computed(() => {
    if (score.value >= 3) return 'bg-success'
    if (score.value === 2) return 'bg-warning'
    return 'bg-error'
})
</script>
