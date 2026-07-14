<template>
    <UModal
        :open="open"
        :title="title"
        :description="description"
        :ui="mergedUi"
        @update:open="(value: boolean) => emit('update:open', value)"
    >
        <template #body>
            <slot />
        </template>

        <template v-if="$slots.footer || showDefaultFooter || viewOnly" #footer>
            <slot name="footer">
                <div class="flex justify-end gap-2 w-full">
                    <BaseButton color="neutral" variant="soft" @click="emit('update:open', false)">
                        {{ resolvedCancelLabel }}
                    </BaseButton>
                    <BaseButton
                        v-if="!viewOnly"
                        :color="confirmColor"
                        :loading="loading"
                        :type="formId ? 'submit' : 'button'"
                        :form="formId"
                        @click="formId ? undefined : emit('confirm')"
                    >
                        {{ confirmLabel }}
                    </BaseButton>
                </div>
            </slot>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import type { ButtonProps, ModalProps } from '@nuxt/ui'

const props = withDefaults(defineProps<{
    open: boolean
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    ui?: ModalProps['ui']
    showDefaultFooter?: boolean
    viewOnly?: boolean
    formId?: string
    confirmLabel?: string
    cancelLabel?: string
    confirmColor?: ButtonProps['color']
    loading?: boolean
}>(), {
    title: undefined,
    description: undefined,
    size: 'md',
    ui: undefined,
    showDefaultFooter: false,
    viewOnly: false,
    formId: undefined,
    confirmLabel: 'Save',
    cancelLabel: undefined,
    confirmColor: 'primary',
    loading: false
})

const emit = defineEmits<{
    'update:open': [value: boolean]
    confirm: []
}>()

const resolvedCancelLabel = computed(() => props.cancelLabel ?? (props.viewOnly ? 'Close' : 'Cancel'))

const sizeClasses: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-2xl'
}

// Full-screen sheet on mobile (no floating dialog); restores the centered
// floating dialog look from `sm:` up, where there's room for it.
const FULLSCREEN_MOBILE_CONTENT = 'inset-0 translate-x-0 translate-y-0 w-full h-full max-w-full max-h-full rounded-none shadow-none ring-0'
const FLOATING_DESKTOP_CONTENT = 'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[calc(100vw-2rem)] sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:rounded-lg sm:shadow-lg sm:ring sm:ring-default'

const mergedUi = computed<ModalProps['ui']>(() => ({
    content: `${FULLSCREEN_MOBILE_CONTENT} ${FLOATING_DESKTOP_CONTENT} ${sizeClasses[props.size]}`,
    footer: 'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4',
    ...props.ui
}))
</script>
