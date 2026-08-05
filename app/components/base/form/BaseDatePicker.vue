<template>
    <UPopover v-model:open="isOpen">
        <UButton
            color="neutral"
            variant="outline"
            block
            :disabled="disabled"
            trailing-icon="i-lucide-calendar"
            class="h-11 w-full justify-between font-normal"
            :class="[calendarValue ? 'text-highlighted' : 'text-dimmed', props.class]"
        >
            {{ displayLabel }}
        </UButton>

        <template #content>
            <UCalendar
                v-model="calendarValue"
                :min-value="minDate"
                :max-value="maxDate"
                class="p-2"
            />
        </template>
    </UPopover>
</template>

<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

const props = withDefaults(defineProps<{
    min?: string | 'today'
    max?: string | 'today'
    disabled?: boolean
    placeholder?: string
    class?: string
}>(), {
    disabled: false,
    placeholder: 'Select date'
})

const model = defineModel<string | null>({ default: null })

const isOpen = ref(false)

const df = new DateFormatter('en-US', { dateStyle: 'medium' })

function resolveBound(value?: string): DateValue | undefined {
    if (!value) return undefined
    return value === 'today' ? today(getLocalTimeZone()) : parseDate(value)
}

const minDate = computed(() => resolveBound(props.min))
const maxDate = computed(() => resolveBound(props.max))

const calendarValue = computed({
    get: () => (model.value ? parseDate(model.value) : undefined),
    set: (value) => {
        model.value = value ? value.toString() : null
        isOpen.value = false
    }
})

const displayLabel = computed(() => (calendarValue.value ? df.format(calendarValue.value.toDate(getLocalTimeZone())) : props.placeholder))
</script>
