export interface InvoiceSetting {
    uuid: string
    markup_threshold_amount: string
    markup_percentage: string
    markup_fixed_amount: string
    due_days: number
    due_date_reference: 'delivery' | 'schedule_finish'
    interest_rate: string
    interest_period: 'day' | 'week' | 'month'
    interest_base: 'outstanding_balance' | 'full_total'
    is_active: boolean
}

export interface InvoiceSettingPayload {
    markup_threshold_amount: number
    markup_percentage: number
    markup_fixed_amount: number
    due_days: number
    due_date_reference: 'delivery' | 'schedule_finish'
    interest_rate: number
    interest_period: 'day' | 'week' | 'month'
    interest_base: 'outstanding_balance' | 'full_total'
    is_active: boolean
}
