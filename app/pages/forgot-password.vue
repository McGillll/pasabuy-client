<template>
    <AuthPageShell subtitle="Reset your password">
        <UAlert
            v-if="submitted"
            color="success"
            variant="subtle"
            icon="i-lucide-mail-check"
            title="Check your email"
            description="If an account exists for that email, we've sent a link to reset your password."
        />

        <template v-else>
            <UAlert
                v-if="requestError"
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
                <NuxtLink to="/login" class="text-primary hover:underline">Back to sign in</NuxtLink>
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
    layout: false,
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

function validate(state: { email: string }): FormError[] {
    const errors: FormError[] = []
    if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
    return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
    isSubmitting.value = true
    requestError.value = null
    try {
        await forgotPassword(event.data.email)
        submitted.value = true
    } catch (error) {
        if (error instanceof APIError) {
            submitted.value = true
        } else {
            requestError.value = 'Something went wrong. Please try again.'
        }
    } finally {
        isSubmitting.value = false
    }
}
</script>
