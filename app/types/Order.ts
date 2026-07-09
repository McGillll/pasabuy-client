import type { OrderItem } from '@/types/OrderItem'

export interface Order {
    uuid: string
    customer_name: string
    customer_contact: string
    status: 'pending' | 'confirmed' | 'cancelled'
    total_amount: string
    is_editable: boolean
    is_cancellable: boolean
    pasabuy_schedule: { uuid: string } | null
    items: OrderItem[]
    created_at: string
}
