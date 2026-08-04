export interface InvoiceSetting {
    uuid: string
    markup_threshold_amount: string
    markup_percentage: string
    markup_fixed_amount: string
    handling_fee: string
    interest_rate: string
    interest_period: 'day' | 'week' | 'month'
    interest_base: 'outstanding_balance' | 'full_total'
    is_active: boolean
}

export interface InvoiceSettingPayload {
    markup_threshold_amount: number
    markup_percentage: number
    markup_fixed_amount: number
    handling_fee: number
    interest_rate: number
    interest_period: 'day' | 'week' | 'month'
    interest_base: 'outstanding_balance' | 'full_total'
    is_active: boolean
}
