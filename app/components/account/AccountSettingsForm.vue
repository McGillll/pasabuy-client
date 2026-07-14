<template>
    <div class="space-y-6">
        <UCard>
            <template #header>
                <h2 class="font-medium text-highlighted">Profile</h2>
            </template>

            <UForm :state="profileState" :validate="validateProfile" class="space-y-4" @submit="onSubmitProfile">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <UFormField label="First name" name="first_name" required>
                        <UInput v-model="profileState.first_name" class="w-full" />
                    </UFormField>
                    <UFormField label="Last name" name="last_name" required>
                        <UInput v-model="profileState.last_name" class="w-full" />
                    </UFormField>
                </div>
                <UFormField label="Email" name="email" required>
                    <UInput v-model="profileState.email" type="email" icon="i-lucide-mail" class="w-full" />
                </UFormField>
                <BaseButton type="submit" :loading="savingProfile">Save changes</BaseButton>
            </UForm>
        </UCard>

        <UCard>
            <template #header>
                <h2 class="font-medium text-highlighted">Change password</h2>
            </template>

            <UForm :state="passwordState" :validate="validatePassword" class="space-y-4" @submit="onSubmitPassword">
                <UFormField label="Current password" name="current_password" required>
                    <PasswordInput v-model="passwordState.current_password" autocomplete="current-password" />
                </UFormField>
                <UFormField label="New password" name="password" required>
                    <PasswordInput v-model="passwordState.password" autocomplete="new-password" />
                </UFormField>
                <UFormField label="Confirm new password" name="password_confirmation" required>
                    <PasswordInput v-model="passwordState.password_confirmation" autocomplete="new-password" />
                </UFormField>
                <BaseButton type="submit" :loading="savingPassword">Update password</BaseButton>
            </UForm>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { authService } from '@/components/api/auth/AuthService'
import APIError from '@/components/api/user/APIError'

const { user, fetchCurrentUser } = useAuth()
const toast = useToast()

const profileState = reactive({
    first_name: user.value?.first_name ?? '',
    last_name: user.value?.last_name ?? '',
    email: user.value?.email ?? ''
})

watch(user, (value) => {
    if (!value) return
    profileState.first_name = value.first_name
    profileState.last_name = value.last_name
    profileState.email = value.email
}, { immediate: true })

const savingProfile = ref(false)

function validateProfile(state: typeof profileState): FormError[] {
    const errors: FormError[] = []
    if (!state.first_name) errors.push({ name: 'first_name', message: 'First name is required' })
    if (!state.last_name) errors.push({ name: 'last_name', message: 'Last name is required' })
    if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) errors.push({ name: 'email', message: 'Enter a valid email address' })
    return errors
}

async function onSubmitProfile(event: FormSubmitEvent<typeof profileState>) {
    savingProfile.value = true
    try {
        await authService.updateProfile(event.data)
        await fetchCurrentUser()
        toast.add({ title: 'Profile updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingProfile.value = false
    }
}

const passwordState = reactive({
    current_password: '',
    password: '',
    password_confirmation: ''
})

const savingPassword = ref(false)

function validatePassword(state: typeof passwordState): FormError[] {
    const errors: FormError[] = []
    if (!state.current_password) errors.push({ name: 'current_password', message: 'Current password is required' })
    if (!state.password) errors.push({ name: 'password', message: 'New password is required' })
    else if (state.password.length < 8) errors.push({ name: 'password', message: 'Password must be at least 8 characters' })
    if (state.password_confirmation !== state.password) errors.push({ name: 'password_confirmation', message: 'Passwords do not match' })
    return errors
}

async function onSubmitPassword(event: FormSubmitEvent<typeof passwordState>) {
    savingPassword.value = true
    try {
        await authService.updatePassword(event.data)
        passwordState.current_password = ''
        passwordState.password = ''
        passwordState.password_confirmation = ''
        toast.add({ title: 'Password updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingPassword.value = false
    }
}
</script>
