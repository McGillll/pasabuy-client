<template>
    <div>
        <div class="flex items-center gap-3 py-3">
            <BaseAvatar :name="name" size="md" />

            <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-highlighted truncate">{{ name }}</p>
                <NuxtLink
                    v-if="subtitleHref"
                    :to="subtitleHref"
                    class="text-xs text-primary hover:underline truncate block"
                >
                    {{ subtitleLabel }}
                </NuxtLink>
                <p v-else class="text-xs text-muted truncate">{{ subtitleLabel }}</p>
                <p class="text-xs text-dimmed">{{ timestamp }}</p>
            </div>

            <span class="text-sm font-medium text-highlighted shrink-0 font-mono tabular-nums">{{ amount }}</span>

            <ListCardButton icon="i-lucide-ellipsis-vertical" aria-label="Order actions" @click="expanded = !expanded" />
        </div>

        <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-32 opacity-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="max-h-32 opacity-100"
            leave-to-class="max-h-0 opacity-0"
        >
            <div v-if="expanded" class="overflow-hidden pb-3">
                <div class="flex items-center gap-2 rounded-lg bg-elevated p-2 ring-1 ring-default">
                    <BaseButton
                        v-for="item in menuItems"
                        :key="item.label"
                        class="flex-1"
                        :color="item.color ?? 'neutral'"
                        variant="soft"
                        :icon="item.icon"
                        :loading="item.loading"
                        :disabled="item.disabled"
                        @click="selectItem(item)"
                    >
                        {{ item.label }}
                    </BaseButton>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
    name: string
    subtitleLabel: string
    subtitleHref?: string
    timestamp: string
    amount: string
    menuItems: DropdownMenuItem[]
}>()

const expanded = ref(false)

function selectItem(item: DropdownMenuItem) {
    ;(item.onSelect as (() => void) | undefined)?.()
    expanded.value = false
}
</script>
