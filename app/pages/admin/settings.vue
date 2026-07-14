<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">Settings</h1>
            <p class="mt-1 text-sm text-muted">Manage the business information shown to customers.</p>
        </div>

        <UCard>
            <UForm :state="state" :validate="validate" class="space-y-4" @submit="onSubmit">
                <UFormField label="Business name" name="business_name" required>
                    <UInput v-model="state.business_name" :disabled="loading" class="w-full" />
                </UFormField>
                <UFormField label="Contact email" name="contact_email">
                    <UInput v-model="state.contact_email" type="email" icon="i-lucide-mail" :disabled="loading" class="w-full" />
                </UFormField>
                <UFormField label="Contact phone" name="contact_phone">
                    <UInput v-model="state.contact_phone" icon="i-lucide-phone" :disabled="loading" class="w-full" />
                </UFormField>
                <UFormField label="Address" name="address">
                    <UTextarea v-model="state.address" :disabled="loading" class="w-full" :rows="3" />
                </UFormField>
                <BaseButton type="submit" :loading="saving" :disabled="loading">Save changes</BaseButton>
            </UForm>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { settingsService } from '@/components/api/settings/SettingsService'
import APIError from '@/components/api/user/APIError'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const toast = useToast()
const loading = ref(true)
const saving = ref(false)

const state = reactive({
    business_name: '',
    contact_email: '',
    contact_phone: '',
    address: ''
})

function validate(state: { business_name: string }): FormError[] {
    const errors: FormError[] = []
    if (!state.business_name) errors.push({ name: 'business_name', message: 'Business name is required' })
    return errors
}

async function loadSettings() {
    loading.value = true
    try {
        const response = await settingsService.fetchPublicSettings()
        const data = response.data
        state.business_name = data.business_name ?? ''
        state.contact_email = data.contact_email ?? ''
        state.contact_phone = data.contact_phone ?? ''
        state.address = data.address ?? ''
    } catch (error) {
        toast.add({ title: 'Failed to load settings', description: (error as APIError).message, color: 'error' })
    } finally {
        loading.value = false
    }
}

async function onSubmit(event: FormSubmitEvent<typeof state>) {
    saving.value = true
    try {
        await settingsService.updateSettings(event.data)
        toast.add({ title: 'Settings updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        saving.value = false
    }
}

onMounted(loadSettings)
</script>
