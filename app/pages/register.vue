<template>
    <AuthPageShell subtitle="Create a customer account">
        <UAlert
            v-if="submitted"
            color="success"
            variant="subtle"
            icon="i-lucide-check-circle"
            title="Registration submitted"
            description="Please wait for admin approval. You'll be able to log in once your account is approved."
        />

        <template v-else>
            <UAlert
                v-if="registerError"
                color="error"
                variant="subtle"
                icon="i-lucide-alert-circle"
                :title="registerError"
                class="mb-4"
            />

            <UForm :state="state" :validate="validate" class="flex flex-col gap-5" @submit="onSubmit">
                <div class="grid grid-cols-2 gap-3">
                    <UFormField label="First name" name="first_name" required>
                        <UInput v-model="state.first_name" placeholder="Jane" icon="i-lucide-user" size="xl" class="w-full" />
                    </UFormField>
                    <UFormField label="Last name" name="last_name" required>
                        <UInput v-model="state.last_name" placeholder="Dela Cruz" icon="i-lucide-user" size="xl" class="w-full" />
                    </UFormField>
                </div>

                <UFormField label="Email" name="email" required>
                    <UInput
                        v-model="state.email"
                        type="email"
                        placeholder="you@example.com"
                        icon="i-lucide-mail"
                        autocomplete="email"
                        size="xl"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Contact number" name="contact_number">
                    <UInput v-model="state.contact_number" placeholder="09171234567" icon="i-lucide-phone" size="xl" class="w-full" />
                </UFormField>

                <UFormField label="Messenger name" name="messenger_name">
                    <UInput v-model="state.messenger_name" placeholder="Jane Dela Cruz" icon="i-lucide-message-circle" size="xl" class="w-full" />
                </UFormField>

                <UFormField label="Password" name="password" required>
                    <PasswordInput v-model="state.password" autocomplete="new-password" :show-toggle="false" :visible="passwordsVisible" />
                </UFormField>

                <UFormField label="Confirm password" name="password_confirmation" required>
                    <PasswordInput v-model="state.password_confirmation" autocomplete="new-password" :show-toggle="false" :visible="passwordsVisible" />
                </UFormField>

                <UCheckbox v-model="passwordsVisible" label="Show passwords" size="sm" />

                <UFormField name="terms_accepted">
                    <UCheckbox
                        :model-value="state.terms_accepted"
                        size="sm"
                        @update:model-value="onTermsCheckboxChange"
                    >
                        <template #label>
                            <span class="text-sm text-default">
                                I agree to the
                                <NuxtLink :to="{ path: '/terms', query: { from: 'register' } }" class="text-primary hover:underline" @click.stop>Terms of Service</NuxtLink>
                                and
                                <NuxtLink :to="{ path: '/privacy', query: { from: 'register' } }" class="text-primary hover:underline" @click.stop>Privacy Policy</NuxtLink>
                            </span>
                        </template>
                    </UCheckbox>
                </UFormField>

                <BaseButton type="submit" block size="xl" :loading="isSubmitting">
                    Create account
                </BaseButton>
            </UForm>
        </template>

        <template #footer>
            <p class="mt-6 text-center text-sm text-dimmed">
                Already have an account?
                <NuxtLink :to="loginLink" class="text-primary hover:underline">Sign in</NuxtLink>
            </p>
        </template>
    </AuthPageShell>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { publicCustomerService } from '@/components/api/public/PublicCustomerService'
import APIError from '@/components/api/user/APIError'
import type { RegisterFormState } from '@/composables/useRegisterFormDraft'

definePageMeta({
    layout: false,
})

useHead({ title: 'Create Account' })

const route = useRoute()

const loginLink = computed(() => {
    const redirect = route.query.redirect as string | undefined
    return redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
})

const { state, reset: resetDraft } = useRegisterFormDraft()
const { hasViewedLegalDocs } = useLegalAcknowledgement()

const isSubmitting = ref(false)
const submitted = ref(false)
const registerError = ref<string | null>(null)
const passwordsVisible = ref(false)

function onTermsCheckboxChange(value: boolean | 'indeterminate') {
    const isChecked = value === true
    if (isChecked && !hasViewedLegalDocs.value) {
        navigateTo({ path: '/terms', query: { from: 'register' } })
        return
    }
    state.value.terms_accepted = isChecked
}

function validate(state: {
    first_name: string
    last_name: string
    email: string
    password: string
    password_confirmation: string
    terms_accepted: boolean
}): FormError[] {
    const errors: FormError[] = []
    if (!state.first_name) errors.push({ name: 'first_name', message: 'First name is required' })
    if (!state.last_name) errors.push({ name: 'last_name', message: 'Last name is required' })
    if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
    if (!state.password) errors.push({ name: 'password', message: 'Password is required' })
    else if (state.password.length < 8) errors.push({ name: 'password', message: 'Password must be at least 8 characters' })
    if (state.password_confirmation !== state.password) {
        errors.push({ name: 'password_confirmation', message: 'Passwords do not match' })
    }
    if (!state.terms_accepted) {
        errors.push({ name: 'terms_accepted', message: 'You must agree to the Terms of Service and Privacy Policy' })
    }
    return errors
}

async function onSubmit(event: FormSubmitEvent<RegisterFormState>) {
    isSubmitting.value = true
    registerError.value = null
    try {
        await publicCustomerService.register({
            first_name: event.data.first_name,
            last_name: event.data.last_name,
            email: event.data.email,
            password: event.data.password,
            password_confirmation: event.data.password_confirmation,
            contact_number: event.data.contact_number || undefined,
            messenger_name: event.data.messenger_name || undefined,
            terms_accepted: event.data.terms_accepted,
        })
        submitted.value = true
        resetDraft()
    } catch (error) {
        registerError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>
