<template>
    <USlideover v-model:open="open" side="bottom" :title="title" :description="description">
        <template #body>
            <div class="space-y-1.5">
                <BaseButton
                    v-for="action in actions"
                    :key="action.label"
                    block
                    :color="action.color ?? 'neutral'"
                    variant="soft"
                    :icon="action.icon"
                    :ui="{ base: 'justify-start h-11' }"
                    @click="onSelect(action)"
                >
                    {{ action.label }}
                </BaseButton>
            </div>
        </template>
    </USlideover>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

export interface ActionSheetItem {
    label: string
    icon: string
    color?: ButtonProps['color']
    onSelect: () => void
}

defineProps<{
    title?: string
    description?: string
    actions: ActionSheetItem[]
}>()

const open = defineModel<boolean>('open', { default: false })

function onSelect(action: ActionSheetItem) {
    open.value = false
    action.onSelect()
}
</script>
