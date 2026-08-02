<template>
    <AuthPageShell subtitle="Sign in to browse open pasabuys">
        <UAlert
            v-if="authError"
            role="alert"
            aria-live="assertive"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            :title="authError"
            class="mb-4"
        />

        <BaseForm
            :state="state"
            :validate="validate"
            class="flex flex-col gap-5"
            @submit="onSubmit"
        >
            <BaseFormField label="Email" name="email" :error="emailError" required>
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

            <BaseFormField label="Password" name="password" :error="passwordError" required>
                <PasswordInput v-model="state.password" autocomplete="current-password" :disabled="isSubmitting" />
            </BaseFormField>

            <div class="flex flex-wrap items-center justify-between gap-2">
                <BaseCheckbox v-model="state.rememberMe" label="Remember me" size="lg" :disabled="isSubmitting" />
                <NuxtLink
                    to="/forgot-password"
                    class="text-sm text-highlighted underline decoration-dimmed underline-offset-2 hover:decoration-highlighted"
                    :class="{ 'pointer-events-none opacity-50': isSubmitting }"
                    :tabindex="isSubmitting ? -1 : undefined"
                >
                    Forgot password?
                </NuxtLink>
            </div>

            <BaseButton
                type="submit"
                block
                size="xl"
                :loading="isSubmitting"
            >
                Sign in
            </BaseButton>
        </BaseForm>

        <template #footer>
            <p class="mt-6 text-center text-sm text-dimmed">
                New customer?
                <NuxtLink
                    :to="registerLink"
                    class="text-highlighted font-medium underline decoration-dimmed underline-offset-2 hover:decoration-highlighted"
                    :class="{ 'pointer-events-none opacity-50': isSubmitting }"
                    :tabindex="isSubmitting ? -1 : undefined"
                >
                    Create an account
                </NuxtLink>
            </p>

            <p class="mt-4 text-center text-xs text-dimmed">
                &copy; {{ currentYear }} Pasabuy. All rights reserved.
            </p>
        </template>
    </AuthPageShell>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
    middleware: 'guest',
})

useHead({ title: 'Sign In' })

const route = useRoute()
const currentYear = new Date().getFullYear()

const registerLink = computed(() => {
    const redirect = route.query.redirect as string | undefined
    return redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'
})

const { state, isSubmitting, authError, emailError, passwordError, validate, onSubmit } = useLoginForm()
</script>
