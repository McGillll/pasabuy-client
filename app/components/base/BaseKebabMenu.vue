<template>
    <UDropdownMenu :items="items" :content="{ align: contentAlign }">
        <BaseIconButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            :aria-label="ariaLabel"
        />
    </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

withDefaults(defineProps<{
    items: DropdownMenuItem[]
    ariaLabel?: string
    contentAlign?: 'start' | 'end'
}>(), {
    ariaLabel: 'More actions',
    contentAlign: 'end'
})
</script>
