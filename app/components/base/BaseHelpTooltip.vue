<template>
    <UPopover :content="{ side: 'top' }">
        <button
            type="button"
            class="relative inline-flex size-5 items-center justify-center text-dimmed hover:text-muted after:absolute after:-inset-3 after:content-['']"
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
