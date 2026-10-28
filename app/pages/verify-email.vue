<template>
    <AuthPageShell subtitle="Verify your email">
        <div v-if="status === 'pending'" class="flex flex-col items-center gap-3 py-4 text-center">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
            <p class="text-sm text-dimmed">Verifying your email address...</p>
        </div>

        <UAlert
            v-else-if="status === 'success'"
            role="alert"
            aria-live="polite"
            color="success"
            variant="subtle"
            icon="i-lucide-mail-check"
            title="Email verified"
            description="Your email address has been confirmed. You can now access every feature of your account."
        />

        <UAlert
            v-else
            role="alert"
            aria-live="assertive"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            title="Verification failed"
            :description="errorMessage ?? 'This verification link is invalid or incomplete.'"
        >
            <template v-if="user" #actions>
                <BaseButton size="xs" color="error" variant="soft" :loading="resending" @click="resendVerification">
                    Resend verification email
                </BaseButton>
            </template>
        </UAlert>

        <template #footer>
            <p class="mt-6 text-center text-sm text-dimmed">
                <NuxtLink to="/login" class="text-highlighted font-medium underline decoration-dimmed underline-offset-2 hover:decoration-highlighted">Back to sign in</NuxtLink>
            </p>

            <p class="mt-4 text-center text-xs text-dimmed">
                &copy; {{ currentYear }} Pasabuy. All rights reserved.
            </p>
        </template>
    </AuthPageShell>
</template>

<script setup lang="ts">
import APIError from '@/components/api/user/APIError'

// No guest middleware: a logged-in user must be able to land here from an emailed verification link.
definePageMeta({
    layout: 'auth',
    authPanel: 'right',
    pageTransition: {
        mode: 'out-in',
        enterActiveClass: 'transition duration-300 ease-out motion-reduce:transition-none',
        enterFromClass: 'opacity-0 translate-y-2',
        leaveActiveClass: 'transition duration-200 ease-in motion-reduce:transition-none',
        leaveToClass: 'opacity-0'
    },
})

useHead({ title: 'Verify Email' })

const currentYear = new Date().getFullYear()
const route = useRoute()
const toast = useToast()
const { user, verifyEmail, resendVerificationEmail } = useAuth()

const status = ref<'pending' | 'success' | 'error'>('pending')
const errorMessage = ref<string | null>(null)
const resending = ref(false)

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

async function resendVerification() {
    resending.value = true
    try {
        await resendVerificationEmail()
        toast.add({ title: 'Verification email sent', description: 'Check your inbox for a new link.', color: 'success' })
    } catch (error) {
        toast.add({
            title: 'Could not resend',
            description: error instanceof APIError ? error.message : 'Something went wrong. Please try again.',
            color: 'error',
        })
    } finally {
        resending.value = false
    }
}
</script>
