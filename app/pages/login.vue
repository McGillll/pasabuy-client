<template>
    <AuthPageShell subtitle="Seller sign in">
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

        <template #footer>
            <p class="mt-6 text-center text-xs text-white/40">
                &copy; {{ currentYear }} Pasabuy. All rights reserved.
            </p>
        </template>
    </AuthPageShell>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
})

const currentYear = new Date().getFullYear()

const { state, isSubmitting, authError, validate, onSubmit } = useLoginForm('/admin')
</script>
