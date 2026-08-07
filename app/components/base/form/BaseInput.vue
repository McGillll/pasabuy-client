<template>
    <UInput
        ref="input"
        v-model="innerModel"
        :model-modifiers="currency ? {} : modelModifiers"
        :type="currency ? 'text' : type"
        :placeholder="placeholder"
        :icon="icon"
        :trailing-icon="trailingIcon"
        :size="size"
        :color="color"
        :variant="variant"
        :disabled="disabled"
        :max="max"
        :autocomplete="autocomplete"
        :class="class"
        :ui="mergedUi"
        @focus="isFocused = true"
        @blur="isFocused = false"
    >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
    </UInput>
</template>

<script setup lang="ts">
import type { InputProps } from '@nuxt/ui'

const props = withDefaults(defineProps<{
    type?: string
    placeholder?: string
    icon?: string
    trailingIcon?: string
    size?: InputProps['size']
    color?: InputProps['color']
    variant?: InputProps['variant']
    disabled?: boolean
    max?: number
    autocomplete?: string
    currency?: boolean
    class?: string
    ui?: InputProps['ui']
}>(), {
    type: 'text',
    size: 'md',
    disabled: false,
    currency: false,
    class: 'w-full'
})

const [model, modelModifiers] = defineModel<string | number | null>()

const isFocused = ref(false)
const currencyDisplayValue = ref('')
const input = useTemplateRef<{ inputRef: HTMLInputElement }>('input')

watch(model, (value) => {
    if (!props.currency || isFocused.value) return
    currencyDisplayValue.value = formatCurrencyValue(value)
}, { immediate: true })

const innerModel = computed({
    get: () => props.currency ? currencyDisplayValue.value : (model.value ?? undefined),
    set: (value) => {
        if (!props.currency) {
            model.value = value ?? null
            return
        }

        const normalizedValue = normalizeCurrencyValue(String(value ?? ''))
        const numericValue = normalizedValue === '' || normalizedValue === '.' ? null : Number(normalizedValue)
        const clippedValue = numericValue !== null && props.max !== undefined
            ? Math.min(numericValue, props.max)
            : numericValue

        const formattedValue = formatCurrencyValue(clippedValue)
        currencyDisplayValue.value = formattedValue
        model.value = clippedValue

        const nativeInput = input.value?.inputRef
        if (nativeInput && nativeInput.value !== formattedValue) {
            nativeInput.value = formattedValue
        }
    }
})

const mergedUi = computed(() => ({ base: 'h-11', ...(props.ui ?? {}) }))

function normalizeCurrencyValue(value: string): string {
    const numericValue = value.replace(/[^\d.]/g, '')
    const [rawWhole = '', ...decimalParts] = numericValue.split('.')
    const whole = rawWhole.replace(/^0+(?=\d)/, '') || '0'

    return decimalParts.length > 0 ? `${whole}.${decimalParts.join('')}` : (rawWhole ? whole : '')
}

function formatCurrencyValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return ''

    const normalizedValue = normalizeCurrencyValue(String(value))
    if (!normalizedValue) return ''

    const [whole, decimal] = normalizedValue.split('.')
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return decimal === undefined ? formattedWhole : `${formattedWhole}.${decimal}`
}
</script>
