<template>
    <div class="min-h-screen flex items-center justify-center bg-default px-4">
        <div class="w-full max-w-sm">
            <div class="flex flex-col items-center gap-2 mb-8">
                <div class="flex items-center justify-center size-12 rounded-lg bg-primary text-inverted font-bold text-xl">
                    P
                </div>
                <h1 class="text-lg font-semibold text-highlighted">
                    Pasabuy
                </h1>
                <p class="text-sm text-muted">
                    Seller sign in
                </p>
            </div>

            <UCard>
                <UAlert
                    v-if="authError"
                    color="error"
                    variant="subtle"
                    icon="i-lucide-alert-circle"
                    :title="authError"
                    class="mb-4"
                />

                <UForm
                    :state="state"
                    :validate="validate"
                    class="flex flex-col gap-4"
                    @submit="onSubmit"
                >
                    <UFormField label="Email" name="email" required>
                        <UInput
                            v-model="state.email"
                            type="email"
                            placeholder="you@example.com"
                            icon="i-lucide-mail"
                            autocomplete="email"
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField label="Password" name="password" required>
                        <UInput
                            v-model="state.password"
                            type="password"
                            placeholder="••••••••"
                            icon="i-lucide-lock"
                            autocomplete="current-password"
                            class="w-full"
                        />
                    </UFormField>

                    <div class="flex items-center justify-between">
                        <UCheckbox v-model="state.rememberMe" label="Remember me" />
                    </div>

                    <UButton
                        type="submit"
                        block
                        :loading="isSubmitting"
                    >
                        Sign in
                    </UButton>
                </UForm>
            </UCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import APIError from '@/components/api/user/APIError'

definePageMeta({
    layout: false,
})

const { login } = useAuth()
const route = useRoute()

const state = reactive({
    email: '',
    password: '',
    rememberMe: false,
})

const isSubmitting = ref(false)
const authError = ref<string | null>(null)

function validate(state: { email: string; password: string }): FormError[] {
    const errors: FormError[] = []
    if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
    if (!state.password) errors.push({ name: 'password', message: 'Password is required' })
    return errors
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
    isSubmitting.value = true
    authError.value = null
    try {
        await login(event.data.email, event.data.password, state.rememberMe)
        const redirect = (route.query.redirect as string) || '/admin/products'
        await navigateTo(redirect)
    } catch (error) {
        authError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>
