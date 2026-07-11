export interface OrderPayment {
    uuid: string
    amount: string
    method: 'cash' | 'gcash' | 'bank_transfer' | 'maya' | 'other'
    reference_number: string | null
    notes: string | null
    paid_at: string
    recorded_by?: { uuid: string; full_name: string }
    created_at: string
}
