<template>
    <AuthPageShell subtitle="Customer sign in">
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
                <PasswordInput v-model="state.password" autocomplete="current-password" />
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

        <template #footer>
            <p class="mt-6 text-center text-sm text-dimmed">
                New customer?
                <NuxtLink :to="registerLink" class="text-primary hover:underline">Create an account</NuxtLink>
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
})

const route = useRoute()
const currentYear = new Date().getFullYear()

const registerLink = computed(() => {
    const redirect = route.query.redirect as string | undefined
    return redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'
})

const { state, isSubmitting, authError, validate, onSubmit } = useLoginForm('/customer')
</script>
