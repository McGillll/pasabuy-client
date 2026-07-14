export interface Invoice {
    subtotal: number
    markup_amount: number
    invoice_total: number
    due_date: string | null
    is_overdue: boolean
    elapsed_periods: number
    interest_amount: number
    total_payable: number
    amount_paid: number
    balance_due: number
}
