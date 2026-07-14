export interface InvoiceItem {
    product_name: string
    quantity: number
    unit_price: number
    line_total: number
}

export interface InvoiceInterestLine {
    period: number
    label: string
    interest_amount: number
    running_total: number
}

export interface InvoicePayment {
    paid_at: string
    amount: number
    method: string
    reference_number: string | null
}

export interface Invoice {
    items: InvoiceItem[]
    subtotal: number
    markup_amount: number
    total: number
    due_date: string | null
    is_overdue: boolean
    interest_base: 'full_total' | 'outstanding_balance'
    interest_lines: InvoiceInterestLine[]
    interest_total: number
    grand_total: number
    payments: InvoicePayment[]
    amount_paid: number
    balance_due: number
}
