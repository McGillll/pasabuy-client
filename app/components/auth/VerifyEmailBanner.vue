<template>
    <UAlert
        v-if="user && !user.is_verified"
        color="warning"
        variant="subtle"
        icon="i-lucide-mail-warning"
        title="Verify your email address"
        description="Some actions are unavailable until you confirm your email."
        class="mb-4"
        :actions="[{ label: 'Resend email', color: 'warning', variant: 'subtle', loading: isSending, onClick: onResend }]"
    />
</template>

<script setup lang="ts">
import APIError from '@/components/api/user/APIError'

const { user, resendVerificationEmail } = useAuth()
const toast = useToast()
const isSending = ref(false)

async function onResend() {
    isSending.value = true
    try {
        await resendVerificationEmail()
        toast.add({
            title: 'Verification email sent',
            description: 'Please check your inbox for the verification link.',
            color: 'success',
        })
    } catch (error) {
        toast.add({
            title: 'Something went wrong',
            description: error instanceof APIError ? error.message : 'Please try again.',
            color: 'error',
        })
    } finally {
        isSending.value = false
    }
}
</script>
