<template>
    <AuthPageShell subtitle="Verify your email">
        <div v-if="status === 'pending'" class="flex flex-col items-center gap-3 py-4 text-center">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
            <p class="text-sm text-dimmed">Verifying your email address...</p>
        </div>

        <UAlert
            v-else-if="status === 'success'"
            color="success"
            variant="subtle"
            icon="i-lucide-mail-check"
            title="Email verified"
            description="Your email address has been confirmed. You can now access every feature of your account."
        />

        <UAlert
            v-else
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            title="Verification failed"
            :description="errorMessage ?? 'This verification link is invalid or incomplete.'"
        />

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
import APIError from '@/components/api/user/APIError'

definePageMeta({
    layout: false,
})

useHead({ title: 'Verify Email' })

const currentYear = new Date().getFullYear()
const route = useRoute()
const { verifyEmail } = useAuth()

const status = ref<'pending' | 'success' | 'error'>('pending')
const errorMessage = ref<string | null>(null)

onMounted(async () => {
    const token = route.query.token as string | undefined

    if (!token) {
        status.value = 'error'
        return
    }

    try {
        await verifyEmail({ token })
        status.value = 'success'
    } catch (error) {
        status.value = 'error'
        errorMessage.value = error instanceof APIError ? error.message : null
    }
})
</script>
