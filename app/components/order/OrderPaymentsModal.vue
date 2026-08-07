<template>
    <BaseModal
        v-model:open="open"
        :title="order ? `${order.customer_name}'s payments` : 'Payments'"
        :description="order?.order_no"
        view-only
    >
        <div v-if="order" class="space-y-4">
            <div v-if="invoiceLoading" class="space-y-2">
                <USkeleton class="h-5 w-full" />
                <USkeleton class="h-5 w-full" />
                <USkeleton class="h-5 w-full" />
            </div>
            <InvoiceBreakdown v-else-if="invoice" :invoice="invoice" :order-items="order.items" />

            <BaseTable :data="payments" :columns="paymentColumns" :loading="paymentsLoading">
                <template #method-cell="{ row }">
                    <span class="capitalize">{{ row.original.method.replace('_', ' ') }}</span>
                </template>
                <template #paid_at-cell="{ row }">
                    {{ formatDate(row.original.paid_at) }}
                </template>
                <template #actions-cell="{ row }">
                    <BaseButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        color="error"
                        variant="ghost"
                        aria-label="Delete payment"
                        @click="deletePayment(row.original)"
                    />
                </template>
                <template #list-item="{ item: payment }">
                    <ListCard :actions="paymentActions(payment)">
                        <template #title>
                            <BaseNumber :value="payment.amount" prefix="₱" class="font-medium text-highlighted" />
                        </template>
                        <template #subtitle>
                            <span class="capitalize">{{ payment.method.replace('_', ' ') }}</span> · {{ formatDate(payment.paid_at) }}
                        </template>
                    </ListCard>
                </template>
                <template #empty>
                    <BaseEmptyState icon="i-lucide-wallet" message="No payments recorded yet." padding="py-6" />
                </template>
            </BaseTable>

            <form class="space-y-3 border-t border-default pt-4" @submit.prevent="submitPayment">
                <div class="grid grid-cols-2 gap-3">
                    <BaseFormField label="Amount" required>
                        <BaseInput v-model.number="paymentForm.amount" type="number" currency :max="invoice?.balance_due" inputmode="decimal" min="0.01" step="0.01" placeholder="0.00">
                            <template #leading>
                                <span class="text-sm text-dimmed">₱</span>
                            </template>
                        </BaseInput>
                    </BaseFormField>
                    <BaseFormField label="Method" required>
                        <BaseSelect v-model="paymentForm.method" :items="paymentMethodOptions" value-key="value" />
                    </BaseFormField>
                </div>
                <BaseFormField label="Paid on" required>
                    <BaseDatePicker v-model="paymentForm.paid_at" />
                </BaseFormField>
                <BaseFormField label="Reference number">
                    <BaseInput v-model="paymentForm.reference_number" placeholder="e.g. GCash reference no." />
                </BaseFormField>
                <BaseFormField label="Notes">
                    <BaseTextarea v-model="paymentForm.notes" placeholder="Optional notes about this payment" />
                </BaseFormField>
                <BaseButton type="submit" block :loading="recordingPayment">Record payment</BaseButton>
            </form>
        </div>
    </BaseModal>

    <BaseConfirmModal
        v-model:open="confirmDialog.open"
        :title="confirmDialog.title"
        :description="confirmDialog.description"
        :color="confirmDialog.color"
        :confirm-label="confirmDialog.confirmLabel"
        :loading="confirming"
        @confirm="confirmDialogAccept"
    />
</template>

<script setup lang="ts">
import { orderService } from '@/components/api/admin/OrderService'
import APIError from '@/components/api/user/APIError'
import type { Invoice } from '@/types/Invoice'
import type { Order } from '@/types/Order'
import type { OrderPayment } from '@/types/OrderPayment'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

const props = defineProps<{
    order: Order | null
}>()

const emit = defineEmits<{
    updated: []
}>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()
const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()

const payments = ref<OrderPayment[]>([])
const paymentsLoading = ref(false)
const recordingPayment = ref(false)
const invoice = ref<Invoice | null>(null)
const invoiceLoading = ref(false)

const paymentMethodOptions = [
    { label: 'Cash', value: 'cash' },
    { label: 'GCash', value: 'gcash' },
    { label: 'Bank transfer', value: 'bank_transfer' },
    { label: 'Maya', value: 'maya' },
    { label: 'Other', value: 'other' }
]

const paymentColumns: TableColumn<OrderPayment>[] = [
    { accessorKey: 'amount', header: 'Amount' },
    { id: 'method', header: 'Method' },
    { id: 'paid_at', header: 'Paid on' },
    { accessorKey: 'reference_number', header: 'Reference' },
    { id: 'actions', header: '' }
]

const paymentForm = reactive({
    amount: null as number | null,
    method: 'cash' as 'cash' | 'gcash' | 'bank_transfer' | 'maya' | 'other',
    reference_number: '',
    notes: '',
    paid_at: ''
})

function resetPaymentForm() {
    paymentForm.amount = null
    paymentForm.method = 'cash'
    paymentForm.reference_number = ''
    paymentForm.notes = ''
    paymentForm.paid_at = new Date().toISOString().slice(0, 10)
}

const paymentsEtags = ref<Record<string, string | null>>({})

async function loadPayments(orderUuid: string) {
    paymentsLoading.value = true
    try {
        const result = await orderService.fetchPaymentsCacheable(orderUuid, paymentsEtags.value[orderUuid] ?? null)
        if (result === 'not-modified') return
        payments.value = result.data
        paymentsEtags.value[orderUuid] = result.etag
    } catch (error) {
        toast.add({
            title: 'Failed to load payments',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadPayments(orderUuid) }]
        })
    } finally {
        paymentsLoading.value = false
    }
}

async function loadInvoice(orderUuid: string) {
    invoiceLoading.value = true
    try {
        const response = await orderService.fetchInvoice(orderUuid)
        invoice.value = response.data
    } catch (error) {
        toast.add({
            title: 'Failed to load invoice',
            description: (error as APIError).message,
            color: 'error',
            actions: [{ label: 'Retry', onClick: () => loadInvoice(orderUuid) }]
        })
    } finally {
        invoiceLoading.value = false
    }
}

watch([open, () => props.order], ([isOpen, order]) => {
    if (isOpen && order) {
        resetPaymentForm()
        loadPayments(order.uuid)
        loadInvoice(order.uuid)
    }
})

async function submitPayment() {
    if (!props.order || !paymentForm.amount || !paymentForm.paid_at) {
        toast.add({ title: 'Amount and paid date are required', color: 'error' })
        return
    }

    recordingPayment.value = true
    try {
        await orderService.recordPayment(props.order.uuid, {
            amount: paymentForm.amount,
            method: paymentForm.method,
            reference_number: paymentForm.reference_number || undefined,
            notes: paymentForm.notes || undefined,
            paid_at: paymentForm.paid_at
        })
        resetPaymentForm()
        toast.add({ title: 'Payment recorded', color: 'success' })
        await Promise.all([loadPayments(props.order.uuid), loadInvoice(props.order.uuid)])
        emit('updated')
    } catch (error) {
        toast.add({ title: 'Failed to record payment', description: (error as APIError).message, color: 'error' })
    } finally {
        recordingPayment.value = false
    }
}

function deletePayment(payment: OrderPayment) {
    if (!props.order) return
    const order = props.order

    askConfirm({
        title: 'Remove payment?',
        description: `Remove the ₱${formatNumber(payment.amount)} payment recorded on ${formatDate(payment.paid_at)}?`,
        confirmLabel: 'Remove',
        color: 'error',
        action: async () => {
            try {
                await orderService.deletePayment(order.uuid, payment.uuid)
                toast.add({ title: 'Payment removed', color: 'success' })
                await Promise.all([loadPayments(order.uuid), loadInvoice(order.uuid)])
                emit('updated')
            } catch (error) {
                toast.add({ title: 'Failed to remove payment', description: (error as APIError).message, color: 'error' })
            }
        }
    })
}

function paymentActions(payment: OrderPayment): DropdownMenuItem[] {
    return [
        { label: 'Delete payment', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => deletePayment(payment) }
    ]
}
</script>
