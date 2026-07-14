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
                    <UInput v-model="state.contact_number" icon="i-lucide-phone" size="xl" class="w-full" />
                </UFormField>

                <UFormField label="Messenger name" name="messenger_name">
                    <UInput v-model="state.messenger_name" icon="i-lucide-message-circle" size="xl" class="w-full" />
                </UFormField>

                <UFormField label="Password" name="password" required>
                    <PasswordInput v-model="state.password" autocomplete="new-password" :show-toggle="false" :visible="passwordsVisible" />
                </UFormField>

                <UFormField label="Confirm password" name="password_confirmation" required>
                    <PasswordInput v-model="state.password_confirmation" autocomplete="new-password" :show-toggle="false" :visible="passwordsVisible" />
                </UFormField>

                <UCheckbox v-model="passwordsVisible" label="Show passwords" size="sm" />

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

definePageMeta({
    layout: false,
})

useHead({ title: 'Create Account' })

const route = useRoute()

const loginLink = computed(() => {
    const redirect = route.query.redirect as string | undefined
    return redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
})

const state = reactive({
    first_name: '',
    last_name: '',
    email: '',
    contact_number: '',
    messenger_name: '',
    password: '',
    password_confirmation: '',
})

const isSubmitting = ref(false)
const submitted = ref(false)
const registerError = ref<string | null>(null)
const passwordsVisible = ref(false)

function validate(state: {
    first_name: string
    last_name: string
    email: string
    password: string
    password_confirmation: string
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
    return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
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
        })
        submitted.value = true
    } catch (error) {
        registerError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>
