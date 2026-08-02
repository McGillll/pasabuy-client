<template>
    <div class="min-h-full max-w-3xl space-y-6">
        <div>
            <h1 class="text-xl font-semibold text-highlighted">Settings</h1>
            <p class="mt-1 text-sm text-muted">Manage your business information and invoice rules.</p>
        </div>

        <nav class="sticky top-0 z-10 -mx-6 flex gap-2 overflow-x-auto border-b border-default bg-default px-6 py-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]">
            <button
                v-for="section in sections"
                :key="section.id"
                type="button"
                class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                :class="activeSection === section.id
                    ? 'border-primary bg-primary text-inverted'
                    : 'border-default bg-elevated text-muted hover:text-highlighted'"
                @click="scrollToSection(section.id)"
            >
                {{ section.label }}
            </button>
        </nav>

        <ClientOnly>
            <div class="space-y-6">
                <section :id="sections[0]!.id" class="scroll-mt-16">
                    <UCard>
                        <BaseForm :state="businessState" :validate="validateBusiness" class="space-y-4" @submit="onSubmitBusiness">
                            <div class="flex items-center gap-3">
                                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <UIcon name="i-lucide-store" class="size-4" />
                                </div>
                                <div>
                                    <h2 class="text-sm font-semibold text-highlighted">Business</h2>
                                    <p class="mt-1 text-sm text-muted">
                                        Shown on your public share link and on customer invoices.
                                    </p>
                                </div>
                            </div>

                            <BaseFormField label="Business name" name="business_name" required>
                                <BaseInput v-model="businessState.business_name" placeholder="My Pasabuy Shop" :disabled="businessLoading" />
                            </BaseFormField>
                            <BaseFormField label="Contact email" name="contact_email">
                                <BaseInput v-model="businessState.contact_email" type="email" placeholder="you@example.com" icon="i-lucide-mail" :disabled="businessLoading" />
                            </BaseFormField>
                            <BaseFormField label="Contact phone" name="contact_phone">
                                <BaseInput v-model="businessState.contact_phone" placeholder="09171234567" icon="i-lucide-phone" :disabled="businessLoading" />
                            </BaseFormField>
                            <BaseFormField label="Address" name="address">
                                <BaseTextarea v-model="businessState.address" placeholder="Store address for pickup or delivery" :disabled="businessLoading" :rows="3" />
                            </BaseFormField>
                            <BaseButton type="submit" :loading="savingBusiness" :disabled="businessLoading">Save changes</BaseButton>
                        </BaseForm>
                    </UCard>
                </section>

                <div class="border-t border-default"></div>

                <BaseForm :state="invoiceState" :validate="validateInvoice" class="space-y-6" @submit="onSubmitInvoice">
                    <section :id="sections[1]!.id" class="scroll-mt-16">
                        <UCard>
                            <div class="flex items-center gap-3">
                                <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <UIcon name="i-lucide-percent" class="size-4" />
                                </div>
                                <h2 class="text-sm font-semibold text-highlighted">Markup</h2>
                                <BaseHelpTooltip>
                                    Markup is added on top of the base product price to set what the customer pays; the difference between what the customer pays and what you receive for the product is your margin. Orders above the threshold amount are charged the markup percentage instead of the fixed markup, and the handling fee is added on every order regardless of which one applies.
                                </BaseHelpTooltip>
                            </div>
                            <p class="mt-1 text-sm text-muted">
                                Orders above the threshold are charged a percentage markup; orders at or below it are charged a flat fee.
                            </p>
                            <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <BaseFormField label="Threshold amount" name="markup_threshold_amount" description="Splits fixed vs percentage markup" required>
                                    <BaseInput v-model.number="invoiceState.markup_threshold_amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" :disabled="invoiceLoading">
                                        <template #leading>
                                            <span class="text-sm text-dimmed">₱</span>
                                        </template>
                                    </BaseInput>
                                </BaseFormField>
                                <BaseFormField label="Markup percentage" name="markup_percentage" description="Applied above the threshold" required>
                                    <BaseInput v-model.number="invoiceState.markup_percentage" type="number" inputmode="decimal" min="0" max="100" step="0.01" placeholder="0.00" :disabled="invoiceLoading">
                                        <template #trailing>
                                            <span class="text-sm text-dimmed">%</span>
                                        </template>
                                    </BaseInput>
                                </BaseFormField>
                                <BaseFormField label="Fixed markup" name="markup_fixed_amount" description="Applied at or below threshold" required>
                                    <BaseInput v-model.number="invoiceState.markup_fixed_amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" :disabled="invoiceLoading">
                                        <template #leading>
                                            <span class="text-sm text-dimmed">₱</span>
                                        </template>
                                    </BaseInput>
                                </BaseFormField>
                                <BaseFormField label="Handling fee" name="handling_fee" description="Flat fee added on every order, on top of markup" required>
                                    <BaseInput v-model.number="invoiceState.handling_fee" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" :disabled="invoiceLoading">
                                        <template #leading>
                                            <span class="text-sm text-dimmed">₱</span>
                                        </template>
                                    </BaseInput>
                                </BaseFormField>
                            </div>
                        </UCard>
                    </section>

                    <div class="border-t border-default"></div>

                    <section :id="sections[2]!.id" class="scroll-mt-16">
                        <UCard :ui="{ root: invoiceState.is_active ? 'ring-1 ring-warning/50 bg-warning/5' : '' }">
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex items-center gap-3">
                                    <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                                        <UIcon name="i-lucide-alarm-clock" class="size-4" />
                                    </div>
                                    <div>
                                        <h2 class="text-sm font-semibold text-highlighted">Overdue interest</h2>
                                        <p class="mt-1 text-sm text-muted">
                                            Once the due date passes, unpaid balances accrue compounding interest each period.
                                        </p>
                                    </div>
                                </div>
                                <BaseSwitch v-model="invoiceState.is_active" label="Apply" class="mt-0.5 shrink-0" :disabled="invoiceLoading" />
                            </div>

                            <div v-if="invoiceState.is_active" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <BaseFormField label="Interest rate" name="interest_rate" description="Percent compounded per period" required>
                                    <BaseInput v-model.number="invoiceState.interest_rate" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00" :disabled="invoiceLoading">
                                        <template #trailing>
                                            <span class="text-sm text-dimmed">%</span>
                                        </template>
                                    </BaseInput>
                                </BaseFormField>
                                <BaseFormField label="Compounding period" name="interest_period" description="How often interest compounds" required>
                                    <BaseSelect v-model="invoiceState.interest_period" :items="interestPeriodOptions" value-key="value" :disabled="invoiceLoading" />
                                </BaseFormField>
                                <BaseFormField label="Interest applies to" name="interest_base" description="What the interest is based on" required>
                                    <BaseSelect v-model="invoiceState.interest_base" :items="interestBaseOptions" value-key="value" :disabled="invoiceLoading" />
                                </BaseFormField>
                            </div>

                            <div v-if="invoiceState.is_active" class="mt-4 rounded-lg bg-elevated/50 p-3">
                                <p class="text-sm font-medium text-highlighted">Worked example</p>
                                <p class="mt-1 text-sm text-muted">
                                    Say an order totals ₱1,000 and the customer has already paid ₱600, leaving ₱400 unpaid past the due date.
                                </p>
                                <ul class="mt-2 space-y-1 text-sm text-muted">
                                    <li><span class="font-medium text-highlighted">Outstanding balance:</span> interest applies only to the ₱400 still owed, so it shrinks as the customer pays more.</li>
                                    <li><span class="font-medium text-highlighted">Full invoice total:</span> interest applies to the original ₱1,000 regardless of the ₱600 already paid.</li>
                                </ul>
                            </div>
                        </UCard>
                    </section>

                    <BaseButton type="submit" :loading="savingInvoice" :disabled="invoiceLoading">Save invoice rules</BaseButton>
                </BaseForm>
            </div>

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
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { settingsService } from '@/components/api/settings/SettingsService'
import { invoiceSettingService } from '@/components/api/settings/InvoiceSettingService'
import APIError from '@/components/api/user/APIError'

definePageMeta({ layout: 'admin', middleware: 'auth' })

useHead({ title: 'Settings' })

const toast = useToast()

const sections = [
    { id: 'section-business', label: 'Business' },
    { id: 'section-markup', label: 'Markup' },
    { id: 'section-interest', label: 'Overdue interest' }
]
const activeSection = ref(sections[0]!.id)

function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

let sectionObserver: IntersectionObserver | null = null
const intersecting = new Map<string, boolean>()

function attachSectionObserver() {
    const els = sections.map((section) => document.getElementById(section.id)).filter(Boolean) as HTMLElement[]
    if (els.length < sections.length) {
        requestAnimationFrame(attachSectionObserver)
        return
    }

    sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => intersecting.set(entry.target.id, entry.isIntersecting))
            const visibleIds = sections.map((section) => section.id).filter((id) => intersecting.get(id))
            if (visibleIds.length) activeSection.value = visibleIds[visibleIds.length - 1]!
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )
    els.forEach((el) => sectionObserver!.observe(el))
}

onMounted(() => {
    attachSectionObserver()
})

onBeforeUnmount(() => {
    sectionObserver?.disconnect()
})

// ---- Business info ----

const businessLoading = ref(true)
const savingBusiness = ref(false)
const settingsEtag = ref<string | null>(null)

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
        const response = await settingsService.fetchPublicSettingsCacheable(settingsEtag.value)
        if (response === 'not-modified') return
        const data = response.data
        businessState.business_name = data.business_name ?? ''
        businessState.contact_email = data.contact_email ?? ''
        businessState.contact_phone = data.contact_phone ?? ''
        businessState.address = data.address ?? ''
        settingsEtag.value = response.etag
    } catch (error) {
        toast.add({
            title: 'Failed to load settings',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadBusinessSettings() }]
        })
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
    handling_fee: 0,
    interest_rate: 1,
    interest_period: 'month' as 'day' | 'week' | 'month',
    interest_base: 'outstanding_balance' as 'outstanding_balance' | 'full_total',
    is_active: true
})

const interestPeriodOptions = [
    { label: 'Per day', value: 'day' },
    { label: 'Per week', value: 'week' },
    { label: 'Per month', value: 'month' }
]

const interestBaseOptions = [
    { label: 'Outstanding balance (shrinks as customer pays)', value: 'outstanding_balance' },
    { label: 'Full invoice total (ignores partial payments)', value: 'full_total' }
]

function validateInvoice(state: { markup_threshold_amount: number, markup_percentage: number, markup_fixed_amount: number, handling_fee: number, interest_rate: number }): FormError[] {
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
    if (state.handling_fee === null || state.handling_fee < 0) {
        errors.push({ name: 'handling_fee', message: 'Handling fee must be 0 or more' })
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
        invoiceState.handling_fee = Number(data.handling_fee)
        invoiceState.interest_rate = Number(data.interest_rate)
        invoiceState.interest_period = data.interest_period
        invoiceState.interest_base = data.interest_base
        invoiceState.is_active = data.is_active
    } catch (error) {
        toast.add({
            title: 'Failed to load invoice settings',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadInvoiceSettings() }]
        })
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
