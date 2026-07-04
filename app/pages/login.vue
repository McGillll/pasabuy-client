<template>
    <div class="dark relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
        <div class="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div class="pointer-events-none absolute -top-32 -left-32 size-112 rounded-full bg-primary/30 blur-3xl" />
        <div class="pointer-events-none absolute -bottom-32 -right-32 size-112 rounded-full bg-primary/20 blur-3xl" />
        <div class="pointer-events-none absolute top-1/2 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

        <div class="relative w-full max-w-sm">
            <div class="flex flex-col items-center gap-3 mb-8">
                <div class="flex items-center justify-center size-14 rounded-2xl bg-primary text-inverted font-bold text-2xl shadow-lg shadow-primary/30">
                    P
                </div>
                <div class="text-center">
                    <h1 class="text-xl font-semibold text-white">Pasabuy</h1>
                    <p class="text-sm text-white/60">Seller sign in</p>
                </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
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
                    class="flex flex-col gap-5"
                    @submit="onSubmit"
                >
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

                    <UFormField label="Password" name="password" required>
                        <UInput
                            v-model="state.password"
                            type="password"
                            placeholder="••••••••"
                            icon="i-lucide-lock"
                            autocomplete="current-password"
                            size="xl"
                            class="w-full"
                        />
                    </UFormField>

                    <div class="flex items-center justify-between">
                        <UCheckbox v-model="state.rememberMe" label="Remember me" size="lg" />
                    </div>

                    <UButton
                        type="submit"
                        block
                        size="xl"
                        :loading="isSubmitting"
                    >
                        Sign in
                    </UButton>
                </UForm>
            </div>

            <p class="mt-6 text-center text-xs text-white/40">
                &copy; {{ currentYear }} Pasabuy. All rights reserved.
            </p>
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

const currentYear = new Date().getFullYear()

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
        const redirect = (route.query.redirect as string) || '/admin'
        await navigateTo(redirect)
    } catch (error) {
        authError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>
