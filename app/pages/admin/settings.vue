<template>
    <div class="max-w-3xl space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">Settings</h1>
            <p class="mt-1 text-sm text-muted">Manage your business information and invoice rules.</p>
        </div>

        <ClientOnly>
            <UTabs v-model="activeTab" :items="tabs" class="w-full">
                <template #business>
                    <UCard class="mt-4">
                        <UForm :state="businessState" :validate="validateBusiness" class="space-y-4" @submit="onSubmitBusiness">
                            <UFormField label="Business name" name="business_name" required>
                                <UInput v-model="businessState.business_name" :disabled="businessLoading" class="w-full" />
                            </UFormField>
                            <UFormField label="Contact email" name="contact_email">
                                <UInput v-model="businessState.contact_email" type="email" icon="i-lucide-mail" :disabled="businessLoading" class="w-full" />
                            </UFormField>
                            <UFormField label="Contact phone" name="contact_phone">
                                <UInput v-model="businessState.contact_phone" icon="i-lucide-phone" :disabled="businessLoading" class="w-full" />
                            </UFormField>
                            <UFormField label="Address" name="address">
                                <UTextarea v-model="businessState.address" :disabled="businessLoading" class="w-full" :rows="3" />
                            </UFormField>
                            <BaseButton type="submit" :loading="savingBusiness" :disabled="businessLoading">Save changes</BaseButton>
                        </UForm>
                    </UCard>
                </template>

                <template #invoice>
                    <UCard class="mt-4">
                        <UForm :state="invoiceState" :validate="validateInvoice" class="space-y-6" @submit="onSubmitInvoice">
                            <div>
                                <h2 class="text-sm font-medium text-highlighted">Markup</h2>
                                <p class="mt-1 text-sm text-muted">
                                    Orders above the threshold are charged a percentage markup; orders at or below it are charged a flat fee.
                                </p>
                                <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <UFormField label="Threshold amount" name="markup_threshold_amount" description="Splits fixed vs percentage markup" required>
                                        <UInput v-model.number="invoiceState.markup_threshold_amount" type="number" inputmode="decimal" min="0" step="0.01" :disabled="invoiceLoading" class="w-full">
                                            <template #leading>
                                                <span class="text-sm text-dimmed">₱</span>
                                            </template>
                                        </UInput>
                                    </UFormField>
                                    <UFormField label="Markup percentage" name="markup_percentage" description="Applied above the threshold" required>
                                        <UInput v-model.number="invoiceState.markup_percentage" type="number" inputmode="decimal" min="0" max="100" step="0.01" :disabled="invoiceLoading" class="w-full">
                                            <template #trailing>
                                                <span class="text-sm text-dimmed">%</span>
                                            </template>
                                        </UInput>
                                    </UFormField>
                                    <UFormField label="Fixed markup" name="markup_fixed_amount" description="Applied at or below threshold" required>
                                        <UInput v-model.number="invoiceState.markup_fixed_amount" type="number" inputmode="decimal" min="0" step="0.01" :disabled="invoiceLoading" class="w-full">
                                            <template #leading>
                                                <span class="text-sm text-dimmed">₱</span>
                                            </template>
                                        </UInput>
                                    </UFormField>
                                </div>
                            </div>

                            <div class="border-t border-default pt-6">
                                <div class="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 class="text-sm font-medium text-highlighted">Overdue interest</h2>
                                        <p class="mt-1 text-sm text-muted">
                                            Once the due date passes, unpaid balances accrue compounding interest each period.
                                        </p>
                                    </div>
                                    <USwitch v-model="invoiceState.is_active" label="Apply" class="mt-0.5 shrink-0" :disabled="invoiceLoading" />
                                </div>

                                <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <UFormField label="Due date starts from" name="due_date_reference" description="Event that starts the countdown" required>
                                        <USelect v-model="invoiceState.due_date_reference" :items="dueDateReferenceOptions" value-key="value" :disabled="invoiceLoading" class="w-full" />
                                    </UFormField>
                                    <UFormField label="Due days" name="due_days" description="Days until payment is due" required>
                                        <UInput v-model.number="invoiceState.due_days" type="number" inputmode="numeric" min="1" :disabled="invoiceLoading" class="w-full" />
                                    </UFormField>
                                </div>

                                <div v-if="invoiceState.is_active" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <UFormField label="Interest rate" name="interest_rate" description="Percent compounded per period" required>
                                        <UInput v-model.number="invoiceState.interest_rate" type="number" inputmode="decimal" min="0" step="0.01" :disabled="invoiceLoading" class="w-full">
                                            <template #trailing>
                                                <span class="text-sm text-dimmed">%</span>
                                            </template>
                                        </UInput>
                                    </UFormField>
                                    <UFormField label="Compounding period" name="interest_period" description="How often interest compounds" required>
                                        <USelect v-model="invoiceState.interest_period" :items="interestPeriodOptions" value-key="value" :disabled="invoiceLoading" class="w-full" />
                                    </UFormField>
                                    <UFormField label="Interest applies to" name="interest_base" description="What the interest is based on" required>
                                        <USelect v-model="invoiceState.interest_base" :items="interestBaseOptions" value-key="value" :disabled="invoiceLoading" class="w-full" />
                                    </UFormField>
                                </div>
                            </div>

                            <BaseButton type="submit" :loading="savingInvoice" :disabled="invoiceLoading">Save changes</BaseButton>
                        </UForm>
                    </UCard>
                </template>
            </UTabs>

            <template #fallback>
                <div class="mt-4 space-y-4">
                    <USkeleton class="h-10 w-full" />
                    <USkeleton class="h-64 w-full" />
                </div>
            </template>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
import type { FormError, FormSubmitEvent, TabsItem } from '@nuxt/ui'
import { settingsService } from '@/components/api/settings/SettingsService'
import { invoiceSettingService } from '@/components/api/settings/InvoiceSettingService'
import APIError from '@/components/api/user/APIError'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const toast = useToast()

const activeTab = ref('business')
const tabs: TabsItem[] = [
    { label: 'Business', icon: 'i-lucide-store', value: 'business', slot: 'business' },
    { label: 'Invoice', icon: 'i-lucide-receipt-text', value: 'invoice', slot: 'invoice' }
]

// ---- Business info ----

const businessLoading = ref(true)
const savingBusiness = ref(false)

const businessState = reactive({
    business_name: '',
    contact_email: '',
    contact_phone: '',
    address: ''
})

function validateBusiness(state: { business_name: string }): FormError[] {
    const errors: FormError[] = []
    if (!state.business_name) errors.push({ name: 'business_name', message: 'Business name is required' })
    return errors
}

async function loadBusinessSettings() {
    businessLoading.value = true
    try {
        const response = await settingsService.fetchPublicSettings()
        const data = response.data
        businessState.business_name = data.business_name ?? ''
        businessState.contact_email = data.contact_email ?? ''
        businessState.contact_phone = data.contact_phone ?? ''
        businessState.address = data.address ?? ''
    } catch (error) {
        toast.add({ title: 'Failed to load settings', description: (error as APIError).message, color: 'error' })
    } finally {
        businessLoading.value = false
    }
}

async function onSubmitBusiness(event: FormSubmitEvent<typeof businessState>) {
    savingBusiness.value = true
    try {
        await settingsService.updateSettings(event.data)
        toast.add({ title: 'Settings updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingBusiness.value = false
    }
}

// ---- Invoice rules ----

const invoiceLoading = ref(true)
const savingInvoice = ref(false)

const invoiceState = reactive({
    markup_threshold_amount: 1000,
    markup_percentage: 10,
    markup_fixed_amount: 100,
    due_days: 15,
    due_date_reference: 'delivery' as 'delivery' | 'schedule_finish',
    interest_rate: 1,
    interest_period: 'month' as 'day' | 'week' | 'month',
    interest_base: 'outstanding_balance' as 'outstanding_balance' | 'full_total',
    is_active: true
})

const dueDateReferenceOptions = [
    { label: 'Order delivery date', value: 'delivery' },
    { label: 'Schedule finish date', value: 'schedule_finish' }
]

const interestPeriodOptions = [
    { label: 'Per day', value: 'day' },
    { label: 'Per week', value: 'week' },
    { label: 'Per month', value: 'month' }
]

const interestBaseOptions = [
    { label: 'Outstanding balance (shrinks as customer pays)', value: 'outstanding_balance' },
    { label: 'Full invoice total (ignores partial payments)', value: 'full_total' }
]

function validateInvoice(state: { markup_threshold_amount: number, markup_percentage: number, markup_fixed_amount: number, due_days: number, interest_rate: number }): FormError[] {
    const errors: FormError[] = []
    if (state.markup_threshold_amount === null || state.markup_threshold_amount < 0) {
        errors.push({ name: 'markup_threshold_amount', message: 'Threshold amount must be 0 or more' })
    }
    if (state.markup_percentage === null || state.markup_percentage < 0 || state.markup_percentage > 100) {
        errors.push({ name: 'markup_percentage', message: 'Markup percentage must be between 0 and 100' })
    }
    if (state.markup_fixed_amount === null || state.markup_fixed_amount < 0) {
        errors.push({ name: 'markup_fixed_amount', message: 'Fixed markup must be 0 or more' })
    }
    if (!state.due_days || state.due_days < 1) {
        errors.push({ name: 'due_days', message: 'Due days must be at least 1' })
    }
    if (state.interest_rate === null || state.interest_rate < 0) {
        errors.push({ name: 'interest_rate', message: 'Interest rate must be 0 or more' })
    }
    return errors
}

async function loadInvoiceSettings() {
    invoiceLoading.value = true
    try {
        const response = await invoiceSettingService.fetchInvoiceSettings()
        const data = response.data
        invoiceState.markup_threshold_amount = Number(data.markup_threshold_amount)
        invoiceState.markup_percentage = Number(data.markup_percentage)
        invoiceState.markup_fixed_amount = Number(data.markup_fixed_amount)
        invoiceState.due_days = data.due_days
        invoiceState.due_date_reference = data.due_date_reference
        invoiceState.interest_rate = Number(data.interest_rate)
        invoiceState.interest_period = data.interest_period
        invoiceState.interest_base = data.interest_base
        invoiceState.is_active = data.is_active
    } catch (error) {
        toast.add({ title: 'Failed to load invoice settings', description: (error as APIError).message, color: 'error' })
    } finally {
        invoiceLoading.value = false
    }
}

async function onSubmitInvoice(event: FormSubmitEvent<typeof invoiceState>) {
    savingInvoice.value = true
    try {
        await invoiceSettingService.updateInvoiceSettings(event.data)
        toast.add({ title: 'Invoice settings updated', color: 'success' })
    } catch (error) {
        toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
    } finally {
        savingInvoice.value = false
    }
}

onMounted(() => {
    loadBusinessSettings()
    loadInvoiceSettings()
})
</script>
