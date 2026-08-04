<template>
    <UInput
        v-model="model"
        :type="isVisible ? 'text' : 'password'"
        :placeholder="placeholder"
        icon="i-lucide-lock"
        :autocomplete="autocomplete"
        :disabled="disabled"
        size="xl"
        class="w-full h-11"
    >
        <template v-if="showToggle" #trailing>
            <BaseButton
                color="neutral"
                variant="ghost"
                size="xs"
                :icon="internalVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="internalVisible ? 'Hide password' : 'Show password'"
                :disabled="disabled"
                @click="internalVisible = !internalVisible"
            />
        </template>
    </UInput>
</template>

<script setup lang="ts">
const model = defineModel<string>({ default: '' })

const props = withDefaults(defineProps<{
    placeholder?: string
    autocomplete?: string
    showToggle?: boolean
    visible?: boolean
    disabled?: boolean
}>(), {
    placeholder: '••••••••',
    autocomplete: 'current-password',
    showToggle: true,
    visible: false,
    disabled: false,
})

const internalVisible = ref(false)
const isVisible = computed(() => props.showToggle ? internalVisible.value : props.visible)
</script>
