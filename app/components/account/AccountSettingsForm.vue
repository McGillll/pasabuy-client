<template>
    <div class="space-y-6">
        <div class="flex flex-col items-center gap-2 py-2 text-center">
            <BaseAvatar :name="fullName" size="xl" />
            <div>
                <p class="text-base font-semibold text-highlighted">{{ fullName }}</p>
                <p class="text-sm text-muted">{{ user?.email }}</p>
            </div>
        </div>

        <div>
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-dimmed">Profile</p>
            <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <div class="divide-y divide-default">
                    <button type="button" class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" @click="openNameModal">
                        <div class="min-w-0">
                            <p class="text-xs font-medium uppercase tracking-wide text-dimmed">Name</p>
                            <p class="mt-0.5 truncate text-sm font-medium text-highlighted">{{ fullName }}</p>
                        </div>
                        <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
                    </button>
                    <button type="button" class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" @click="openEmailModal">
                        <div class="min-w-0">
                            <p class="text-xs font-medium uppercase tracking-wide text-dimmed">Email</p>
                            <p class="mt-0.5 truncate text-sm font-medium text-highlighted">{{ user?.email }}</p>
                        </div>
                        <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
                    </button>
                </div>
            </UCard>
        </div>

        <div>
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-dimmed">Security</p>
            <UCard :ui="{ body: 'p-0 sm:p-0' }">
                <button type="button" class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left" @click="isPasswordModalOpen = true">
                    <div class="min-w-0">
                        <p class="text-xs font-medium uppercase tracking-wide text-dimmed">Password</p>
                        <p class="mt-0.5 text-sm font-medium text-highlighted">••••••••</p>
                    </div>
                    <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
                </button>
            </UCard>
        </div>

        <BaseModal v-model:open="isNameModalOpen" title="Edit name">
            <BaseForm :state="nameState" :validate="validateName" class="space-y-4" @submit="onSubmitName">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <BaseFormField label="First name" name="first_name" required>
                        <BaseInput v-model="nameState.first_name" placeholder="Jane" />
                    </BaseFormField>
                    <BaseFormField label="Last name" name="last_name" required>
                        <BaseInput v-model="nameState.last_name" placeholder="Dela Cruz" />
                    </BaseFormField>
                </div>
                <BaseButton type="submit" block :loading="savingProfile">Save</BaseButton>
            </BaseForm>
        </BaseModal>

        <BaseModal v-model:open="isEmailModalOpen" title="Edit email">
            <BaseForm :state="emailState" :validate="validateEmailField" class="space-y-4" @submit="onSubmitEmail">
                <BaseFormField label="Email" name="email" required>
                    <BaseInput v-model="emailState.email" type="email" placeholder="you@example.com" icon="i-lucide-mail" />
                </BaseFormField>
                <BaseButton type="submit" block :loading="savingProfile">Save</BaseButton>
            </BaseForm>
        </BaseModal>

        <BaseModal v-model:open="isPasswordModalOpen" title="Change password">
            <BaseForm :state="passwordState" :validate="validatePassword" class="space-y-4" @submit="onSubmitPassword">
                <BaseFormField label="Current password" name="current_password" required>
                    <PasswordInput v-model="passwordState.current_password" autocomplete="current-password" />
                </BaseFormField>
                <BaseFormField label="New password" name="password" required>
                    <PasswordInput v-model="passwordState.password" autocomplete="new-password" />
                    <PasswordStrengthMeter :password="passwordState.password" :current-password="passwordState.current_password" />
                </BaseFormField>
                <BaseFormField label="Confirm new password" name="password_confirmation" required>
                    <PasswordInput v-model="passwordState.password_confirmation" autocomplete="new-password" />
                </BaseFormField>
                <BaseButton type="submit" block :loading="savingPassword">Update password</BaseButton>
            </BaseForm>
        </BaseModal>
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

const fullName = computed(() => `${profileState.first_name} ${profileState.last_name}`.trim())

const savingProfile = ref(false)

const isNameModalOpen = ref(false)
const nameState = reactive({ first_name: '', last_name: '' })

function openNameModal() {
    nameState.first_name = profileState.first_name
    nameState.last_name = profileState.last_name
    isNameModalOpen.value = true
}

function validateName(state: typeof nameState): FormError[] {
    const errors: FormError[] = []
    if (!state.first_name) errors.push({ name: 'first_name', message: 'First name is required' })
    if (!state.last_name) errors.push({ name: 'last_name', message: 'Last name is required' })
    return errors
}

async function onSubmitName(event: FormSubmitEvent<typeof nameState>) {
    savingProfile.value = true
    try {
        await authService.updateProfile({ ...profileState, ...event.data })
        await fetchCurrentUser()
        isNameModalOpen.value = false
        toast.add({ title: 'Name updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingProfile.value = false
    }
}

const isEmailModalOpen = ref(false)
const emailState = reactive({ email: '' })

function openEmailModal() {
    emailState.email = profileState.email
    isEmailModalOpen.value = true
}

function validateEmailField(state: typeof emailState): FormError[] {
    const errors: FormError[] = []
    if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) errors.push({ name: 'email', message: 'Enter a valid email address' })
    return errors
}

async function onSubmitEmail(event: FormSubmitEvent<typeof emailState>) {
    savingProfile.value = true
    try {
        await authService.updateProfile({ ...profileState, ...event.data })
        await fetchCurrentUser()
        isEmailModalOpen.value = false
        toast.add({ title: 'Email updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingProfile.value = false
    }
}

const isPasswordModalOpen = ref(false)

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
        isPasswordModalOpen.value = false
        toast.add({ title: 'Password updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingPassword.value = false
    }
}
</script>
