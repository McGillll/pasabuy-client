import type { OrderItem } from '@/types/OrderItem'

export interface Order {
    uuid: string
    customer_name: string
    customer_contact: string
    status: 'pending' | 'confirmed' | 'cancelled'
    payment_status: 'unpaid' | 'partially_paid' | 'paid'
    delivery_status: 'not_delivered' | 'delivered'
    total_amount: string
    is_editable: boolean
    is_cancellable: boolean
    pasabuy_schedule: { uuid: string; title: string; pasabuy_schedule_date: string | null } | null
    items: OrderItem[]
    created_at: string
}
