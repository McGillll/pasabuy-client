import type { OrderItem } from '@/types/OrderItem'

export interface Order {
    uuid: string
    order_no: string
    customer_name: string
    customer_contact: string
    status: 'pending' | 'confirmed' | 'cancelled'
    channel: 'customer' | 'seller'
    payment_status: 'unpaid' | 'partially_paid' | 'paid'
    delivery_status: 'not_delivered' | 'delivered'
    total_amount: string
    amount_paid: number
    amount_due: number
    is_editable: boolean
    is_cancellable: boolean
    pasabuy_schedule: {
        uuid: string
        title: string
        pasabuy_schedule_date: string | null
        status: 'open' | 'closed' | 'finished'
        is_open: boolean
    } | null
    items: OrderItem[]
    created_at: string
}
