<template>
    <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
    >
        <div
            v-if="isBannerVisible"
            class="fixed inset-x-0 bottom-0 z-50 border-t border-default bg-elevated/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
            role="dialog"
            aria-live="polite"
            aria-label="Cookie preferences"
        >
            <div class="mx-auto flex max-w-2xl flex-col gap-4">
                <div class="flex flex-col gap-1">
                    <p class="text-sm font-semibold text-highlighted">We use cookies and local storage</p>
                    <p class="text-sm text-dimmed">
                        We use essential storage to keep you signed in and run the app. With your permission, we'd
                        also like to use analytics storage to understand how Pasabuy is used. Read our
                        <NuxtLink to="/privacy" target="_blank" class="text-primary hover:underline">Privacy Policy</NuxtLink>
                        for details.
                    </p>
                </div>

                <div v-if="showCustomize" class="flex flex-col gap-3 rounded-lg border border-default p-3">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-sm font-medium text-highlighted">Essential</p>
                            <p class="text-xs text-dimmed">Required to keep you signed in. Always on.</p>
                        </div>
                        <BaseSwitch :model-value="true" disabled />
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="text-sm font-medium text-highlighted">Analytics</p>
                            <p class="text-xs text-dimmed">Helps us understand usage. Optional.</p>
                        </div>
                        <BaseSwitch v-model="analyticsEnabled" />
                    </div>
                </div>

                <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <BaseButton
                        v-if="!showCustomize"
                        color="neutral"
                        variant="ghost"
                        size="lg"
                        block
                        class="sm:w-auto"
                        @click="showCustomize = true"
                    >
                        Customize
                    </BaseButton>
                    <BaseButton
                        v-if="showCustomize"
                        color="neutral"
                        variant="ghost"
                        size="lg"
                        block
                        class="sm:w-auto"
                        @click="onSavePreferences"
                    >
                        Save preferences
                    </BaseButton>
                    <BaseButton
                        color="neutral"
                        variant="outline"
                        size="lg"
                        block
                        class="sm:w-auto"
                        @click="acceptEssentialOnly"
                    >
                        Essential only
                    </BaseButton>
                    <BaseButton
                        color="primary"
                        size="lg"
                        block
                        class="sm:w-auto"
                        @click="acceptAll"
                    >
                        Accept all
                    </BaseButton>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
const { isBannerVisible, init, acceptAll, acceptEssentialOnly, savePreferences } = useCookieConsent()

const showCustomize = ref(false)
const analyticsEnabled = ref(false)

onMounted(() => {
    init()
})

function onSavePreferences() {
    savePreferences(analyticsEnabled.value)
    showCustomize.value = false
}
</script>
