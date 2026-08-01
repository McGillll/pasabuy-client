<template>
    <AuthPageShell subtitle="Choose a new password">
        <UAlert
            v-if="!linkValid"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            title="Invalid reset link"
            description="This password reset link is invalid or incomplete. Please request a new one."
            class="mb-4"
        />

        <template v-else>
            <UAlert
                v-if="resetError"
                color="error"
                variant="subtle"
                icon="i-lucide-alert-circle"
                :title="resetError"
                class="mb-4"
            />

            <BaseForm
                :state="state"
                :validate="validate"
                class="flex flex-col gap-5"
                @submit="onSubmit"
            >
                <BaseFormField label="New password" name="password" required>
                    <PasswordInput v-model="state.password" autocomplete="new-password" :show-toggle="false" :visible="passwordsVisible" />
                </BaseFormField>

                <BaseFormField label="Confirm password" name="passwordConfirmation" required>
                    <PasswordInput v-model="state.passwordConfirmation" autocomplete="new-password" :show-toggle="false" :visible="passwordsVisible" />
                </BaseFormField>

                <BaseCheckbox v-model="passwordsVisible" label="Show passwords" size="sm" />

                <BaseButton
                    type="submit"
                    block
                    size="xl"
                    :loading="isSubmitting"
                >
                    Reset password
                </BaseButton>
            </BaseForm>
        </template>

        <template #footer>
            <p class="mt-6 text-center text-sm text-dimmed">
                <NuxtLink to="/forgot-password" class="text-primary hover:underline">Request a new link</NuxtLink>
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
    middleware: 'guest',
})

useHead({ title: 'Reset Password' })

const currentYear = new Date().getFullYear()
const route = useRoute()
const toast = useToast()
const { resetPassword } = useAuth()

const token = computed(() => (route.query.token as string | undefined) ?? '')
const email = computed(() => (route.query.email as string | undefined) ?? '')
const linkValid = computed(() => Boolean(token.value && email.value))

const state = reactive({
    password: '',
    passwordConfirmation: '',
})

const isSubmitting = ref(false)
const resetError = ref<string | null>(null)
const passwordsVisible = ref(false)

function validate(state: { password: string, passwordConfirmation: string }): FormError[] {
    const errors: FormError[] = []
    if (!state.password) {
        errors.push({ name: 'password', message: 'Password is required' })
    } else if (state.password.length < 8) {
        errors.push({ name: 'password', message: 'Password must be at least 8 characters' })
    }

    if (!state.passwordConfirmation) {
        errors.push({ name: 'passwordConfirmation', message: 'Please confirm your password' })
    } else if (state.password && state.passwordConfirmation !== state.password) {
        errors.push({ name: 'passwordConfirmation', message: 'Passwords do not match' })
    }

    return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
    isSubmitting.value = true
    resetError.value = null
    try {
        await resetPassword({
            token: token.value,
            email: email.value,
            password: event.data.password,
            password_confirmation: event.data.passwordConfirmation,
        })
        toast.add({
            title: 'Password reset',
            description: 'Please sign in with your new password.',
            color: 'success',
        })
        await navigateTo('/login')
    } catch (error) {
        resetError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>
