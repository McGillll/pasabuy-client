<template>
    <UInput
        v-model="model"
        :type="visible ? 'text' : 'password'"
        :placeholder="placeholder"
        icon="i-lucide-lock"
        :autocomplete="autocomplete"
        size="xl"
        class="w-full"
    >
        <template #trailing>
            <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                :icon="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="visible ? 'Hide password' : 'Show password'"
                tabindex="-1"
                @click="visible = !visible"
            />
        </template>
    </UInput>
</template>

<script setup lang="ts">
const model = defineModel<string>({ default: '' })

withDefaults(defineProps<{
    placeholder?: string
    autocomplete?: string
}>(), {
    placeholder: '••••••••',
    autocomplete: 'current-password',
})

const visible = ref(false)
</script>
