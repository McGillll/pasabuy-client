<template>
    <UPopover :content="{ side: 'top' }">
        <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center text-dimmed hover:text-muted sm:h-5 sm:w-5"
            aria-label="More information"
        >
            <UIcon name="i-lucide-help-circle" class="size-4" />
        </button>

        <template #content>
            <div class="max-w-64 rounded-lg bg-elevated p-3 text-sm text-muted shadow-sm ring-1 ring-default">
                <slot />
            </div>
        </template>
    </UPopover>
</template>
