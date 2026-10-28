<template>
    <AuthPageShell subtitle="Reset your password">
        <UAlert
            v-if="submitted"
            role="alert"
            aria-live="polite"
            color="success"
            variant="subtle"
            icon="i-lucide-mail-check"
            title="Check your email"
            description="If an account exists for that email, we've sent a link to reset your password."
        />

        <template v-else>
            <UAlert
                v-if="requestError"
                role="alert"
                aria-live="assertive"
                color="error"
                variant="subtle"
                icon="i-lucide-alert-circle"
                :title="requestError"
                class="mb-4"
            />

            <BaseForm
                :state="state"
                :validate="validate"
                class="flex flex-col gap-5"
                @submit="onSubmit"
            >
                <BaseFormField label="Email" name="email" required>
                    <BaseInput
                        v-model="state.email"
                        type="email"
                        placeholder="you@example.com"
                        icon="i-lucide-mail"
                        autocomplete="email"
                        size="xl"
                        :disabled="isSubmitting"
                    />
                </BaseFormField>

                <BaseButton
                    type="submit"
                    block
                    size="xl"
                    :loading="isSubmitting"
                >
                    Send reset link
                </BaseButton>
            </BaseForm>
        </template>

        <template #footer>
            <p class="mt-6 text-center text-sm text-dimmed">
                <NuxtLink
                    to="/login"
                    class="text-highlighted font-medium underline decoration-dimmed underline-offset-2 hover:decoration-highlighted"
                    :class="{ 'pointer-events-none opacity-50': isSubmitting }"
                    :tabindex="isSubmitting ? -1 : undefined"
                >
                    Back to sign in
                </NuxtLink>
            </p>

            <p class="mt-4 text-center text-xs text-dimmed">
                &copy; {{ currentYear }} Pasabuy. All rights reserved.
            </p>
        </template>
    </AuthPageShell>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import APIError from '@/components/api/user/APIError'

definePageMeta({
    layout: 'auth',
    authPanel: 'right',
    pageTransition: {
        mode: 'out-in',
        enterActiveClass: 'transition duration-300 ease-out motion-reduce:transition-none',
        enterFromClass: 'opacity-0 translate-y-2',
        leaveActiveClass: 'transition duration-200 ease-in motion-reduce:transition-none',
        leaveToClass: 'opacity-0'
    },
    middleware: 'guest',
})

useHead({ title: 'Forgot Password' })

const currentYear = new Date().getFullYear()
const { forgotPassword } = useAuth()

const state = reactive({
    email: '',
})

const isSubmitting = ref(false)
const submitted = ref(false)
const requestError = ref<string | null>(null)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(state: { email: string }): FormError[] {
    const errors: FormError[] = []
    if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
    else if (!EMAIL_PATTERN.test(state.email)) errors.push({ name: 'email', message: 'Enter a valid email address' })
    return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
    isSubmitting.value = true
    requestError.value = null
    try {
        await forgotPassword(event.data.email)
        submitted.value = true
    } catch (error) {
        const isGenuineServerFailure = error instanceof APIError && (error.status === undefined || error.status >= 500)
        if (error instanceof APIError && !isGenuineServerFailure) {
            // Anti-enumeration: don't reveal whether the email exists, only surface real server failures.
            submitted.value = true
        } else {
            requestError.value = 'Something went wrong. Please try again.'
        }
    } finally {
        isSubmitting.value = false
    }
}
</script>
