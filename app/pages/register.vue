<template>
    <AuthPageShell subtitle="Create a customer account">
        <UAlert
            v-if="submitted"
            color="success"
            variant="subtle"
            icon="i-lucide-check-circle"
            title="Registration submitted"
            description="Please wait for admin approval. You'll be able to log in once your account is approved."
        />

        <template v-else>
            <div class="mb-6">
                <div class="mb-2 flex items-center justify-between">
                    <span class="text-xs font-medium text-dimmed">Step {{ currentStep }} of {{ steps.length }}</span>
                    <span class="text-xs font-medium text-primary">{{ currentStepTitle }}</span>
                </div>
                <div class="flex gap-1.5">
                    <div
                        v-for="step in steps"
                        :key="step.id"
                        class="h-1.5 flex-1 rounded-full transition-colors duration-300"
                        :class="step.id <= currentStep ? 'bg-primary' : 'bg-muted'"
                    />
                </div>
            </div>

            <UAlert
                v-if="registerError"
                color="error"
                variant="subtle"
                icon="i-lucide-alert-circle"
                :title="registerError"
                class="mb-4"
            />

            <UAlert
                v-if="stepError"
                color="error"
                variant="subtle"
                icon="i-lucide-alert-circle"
                :title="stepError"
                class="mb-4"
            />

            <BaseForm :state="state" :validate="validate" class="flex flex-col gap-5" @submit="onSubmit">
                <div v-if="currentStep === 1" class="flex flex-col gap-5">
                    <div class="grid grid-cols-2 gap-3">
                        <BaseFormField label="First name" name="first_name" required>
                            <BaseInput v-model="state.first_name" placeholder="Jane" icon="i-lucide-user" size="xl" />
                        </BaseFormField>
                        <BaseFormField label="Last name" name="last_name" required>
                            <BaseInput v-model="state.last_name" placeholder="Dela Cruz" icon="i-lucide-user" size="xl" />
                        </BaseFormField>
                    </div>

                    <BaseFormField label="Email" name="email" required>
                        <BaseInput
                            v-model="state.email"
                            type="email"
                            placeholder="you@example.com"
                            icon="i-lucide-mail"
                            autocomplete="email"
                            size="xl"
                           
                        />
                    </BaseFormField>

                    <BaseFormField label="Contact number" name="contact_number">
                        <BaseInput v-model="state.contact_number" placeholder="09171234567" icon="i-lucide-phone" size="xl" />
                    </BaseFormField>

                    <BaseFormField label="Messenger name" name="messenger_name">
                        <BaseInput v-model="state.messenger_name" placeholder="Jane Dela Cruz" icon="i-lucide-message-circle" size="xl" />
                    </BaseFormField>

                    <BaseButton type="button" block size="xl" trailing-icon="i-lucide-arrow-right" @click="goNext">
                        Next
                    </BaseButton>
                </div>

                <div v-else-if="currentStep === 2" class="flex flex-col gap-5">
                    <BaseFormField label="Password" name="password" required>
                        <PasswordInput v-model="state.password" autocomplete="new-password" :show-toggle="false" :visible="passwordsVisible" />
                        <PasswordStrengthMeter :password="state.password" />
                    </BaseFormField>

                    <BaseFormField label="Confirm password" name="password_confirmation" required>
                        <PasswordInput v-model="state.password_confirmation" autocomplete="new-password" :show-toggle="false" :visible="passwordsVisible" />
                    </BaseFormField>

                    <BaseCheckbox v-model="passwordsVisible" label="Show passwords" size="sm" />

                    <div class="flex gap-3">
                        <BaseButton type="button" color="neutral" variant="subtle" size="xl" leading-icon="i-lucide-arrow-left" class="flex-1" @click="goBackStep">
                            Back
                        </BaseButton>
                        <BaseButton type="button" size="xl" trailing-icon="i-lucide-arrow-right" class="flex-1" @click="goNext">
                            Next
                        </BaseButton>
                    </div>
                </div>

                <div v-else class="flex flex-col gap-5">
                    <div class="rounded-xl border border-default bg-muted/40 p-4">
                        <p class="mb-3 text-xs font-medium uppercase tracking-wide text-dimmed">Review your details</p>
                        <dl class="flex flex-col gap-2 text-sm">
                            <div class="flex justify-between gap-3">
                                <dt class="text-dimmed">Name</dt>
                                <dd class="text-right font-medium text-highlighted">{{ state.first_name }} {{ state.last_name }}</dd>
                            </div>
                            <div class="flex justify-between gap-3">
                                <dt class="text-dimmed">Email</dt>
                                <dd class="text-right font-medium text-highlighted break-all">{{ state.email }}</dd>
                            </div>
                            <div v-if="state.contact_number" class="flex justify-between gap-3">
                                <dt class="text-dimmed">Contact number</dt>
                                <dd class="text-right font-medium text-highlighted">{{ state.contact_number }}</dd>
                            </div>
                            <div v-if="state.messenger_name" class="flex justify-between gap-3">
                                <dt class="text-dimmed">Messenger name</dt>
                                <dd class="text-right font-medium text-highlighted">{{ state.messenger_name }}</dd>
                            </div>
                        </dl>
                        <BaseButton
                            type="button"
                            color="neutral"
                            variant="link"
                            size="xs"
                            class="mt-2 px-0"
                            @click="editStep(1)"
                        >
                            Edit details
                        </BaseButton>
                    </div>

                    <BaseFormField name="terms_accepted">
                        <BaseCheckbox
                            :model-value="state.terms_accepted"
                            size="sm"
                            @update:model-value="onTermsCheckboxChange"
                        >
                            <template #label>
                                <span class="text-sm text-default">
                                    I agree to the
                                    <NuxtLink :to="{ path: '/terms', query: { from: 'register' } }" class="text-primary hover:underline" @click.stop>Terms of Service</NuxtLink>
                                    and
                                    <NuxtLink :to="{ path: '/privacy', query: { from: 'register' } }" class="text-primary hover:underline" @click.stop>Privacy Policy</NuxtLink>
                                </span>
                            </template>
                        </BaseCheckbox>
                    </BaseFormField>

                    <div class="flex gap-3">
                        <BaseButton type="button" color="neutral" variant="subtle" size="xl" leading-icon="i-lucide-arrow-left" class="flex-1" @click="goBackStep">
                            Back
                        </BaseButton>
                        <BaseButton type="submit" size="xl" class="flex-2" :loading="isSubmitting">
                            Create account
                        </BaseButton>
                    </div>
                </div>
            </BaseForm>
        </template>

        <template #footer>
            <p class="mt-6 text-center text-sm text-dimmed">
                Already have an account?
                <NuxtLink :to="loginLink" class="text-primary hover:underline">Sign in</NuxtLink>
            </p>
        </template>
    </AuthPageShell>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { publicCustomerService } from '@/components/api/public/PublicCustomerService'
import APIError from '@/components/api/user/APIError'
import type { RegisterFormState } from '@/composables/useRegisterFormDraft'

definePageMeta({
    layout: false,
})

useHead({ title: 'Create Account' })

const route = useRoute()

const loginLink = computed(() => {
    const redirect = route.query.redirect as string | undefined
    return redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
})

const { state, reset: resetDraft } = useRegisterFormDraft()
const { hasViewedLegalDocs } = useLegalAcknowledgement()

const steps = [
    { id: 1, title: 'Personal info', fields: ['first_name', 'last_name', 'email'] },
    { id: 2, title: 'Account security', fields: ['password', 'password_confirmation'] },
    { id: 3, title: 'Review & agree', fields: ['terms_accepted'] },
] as const

const currentStep = useState<number>('register_current_step', () => 1)
const stepError = ref<string | null>(null)
const currentStepTitle = computed(() => steps.find(step => step.id === currentStep.value)?.title ?? '')

const isSubmitting = ref(false)
const submitted = ref(false)
const registerError = ref<string | null>(null)
const passwordsVisible = ref(false)

function onTermsCheckboxChange(value: boolean | 'indeterminate') {
    const isChecked = value === true
    if (isChecked && !hasViewedLegalDocs.value) {
        navigateTo({ path: '/terms', query: { from: 'register' } })
        return
    }
    state.value.terms_accepted = isChecked
}

function goNext() {
    const fields = steps.find(step => step.id === currentStep.value)?.fields ?? []
    const errors = validate(state.value).filter(error => (fields as readonly string[]).includes(error.name as string))
    if (errors.length > 0) {
        stepError.value = errors[0]?.message ?? 'Please fix the highlighted fields before continuing.'
        return
    }
    stepError.value = null
    currentStep.value = Math.min(currentStep.value + 1, steps.length)
}

function goBackStep() {
    stepError.value = null
    currentStep.value = Math.max(currentStep.value - 1, 1)
}

function editStep(stepId: number) {
    stepError.value = null
    currentStep.value = stepId
}

function validate(state: {
    first_name: string
    last_name: string
    email: string
    password: string
    password_confirmation: string
    terms_accepted: boolean
}): FormError[] {
    const errors: FormError[] = []
    if (!state.first_name) errors.push({ name: 'first_name', message: 'First name is required' })
    if (!state.last_name) errors.push({ name: 'last_name', message: 'Last name is required' })
    if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
    if (!state.password) errors.push({ name: 'password', message: 'Password is required' })
    else if (state.password.length < 8) errors.push({ name: 'password', message: 'Password must be at least 8 characters' })
    if (state.password_confirmation !== state.password) {
        errors.push({ name: 'password_confirmation', message: 'Passwords do not match' })
    }
    if (!state.terms_accepted) {
        errors.push({ name: 'terms_accepted', message: 'You must agree to the Terms of Service and Privacy Policy' })
    }
    return errors
}

async function onSubmit(event: FormSubmitEvent<RegisterFormState>) {
    if (currentStep.value !== steps.length) return

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
            terms_accepted: event.data.terms_accepted,
        })
        submitted.value = true
        currentStep.value = 1
        resetDraft()
    } catch (error) {
        registerError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
    } finally {
        isSubmitting.value = false
    }
}
</script>
