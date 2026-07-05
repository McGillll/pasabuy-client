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
                    <p class="text-sm text-white/60">Create a customer account</p>
                </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
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
                                <UInput v-model="state.first_name" size="xl" class="w-full" />
                            </UFormField>
                            <UFormField label="Last name" name="last_name" required>
                                <UInput v-model="state.last_name" size="xl" class="w-full" />
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
                            <UInput
                                v-model="state.password"
                                type="password"
                                placeholder="••••••••"
                                icon="i-lucide-lock"
                                autocomplete="new-password"
                                size="xl"
                                class="w-full"
                            />
                        </UFormField>

                        <UFormField label="Confirm password" name="password_confirmation" required>
                            <UInput
                                v-model="state.password_confirmation"
                                type="password"
                                placeholder="••••••••"
                                icon="i-lucide-lock"
                                autocomplete="new-password"
                                size="xl"
                                class="w-full"
                            />
                        </UFormField>

                        <UButton type="submit" block size="xl" :loading="isSubmitting">
                            Create account
                        </UButton>
                    </UForm>
                </template>
            </div>

            <p class="mt-6 text-center text-sm text-white/60">
                Already have an account?
                <NuxtLink :to="loginLink" class="text-primary hover:underline">Sign in</NuxtLink>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { publicCustomerService } from '@/components/api/public/PublicCustomerService'
import APIError from '@/components/api/user/APIError'

definePageMeta({
    layout: false,
})

const route = useRoute()

const loginLink = computed(() => {
    const redirect = route.query.redirect as string | undefined
    return redirect ? `/customer/login?redirect=${encodeURIComponent(redirect)}` : '/customer/login'
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

function validate(state: typeof state): FormError[] {
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
