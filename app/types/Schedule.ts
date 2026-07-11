import type { Product } from '@/types/Product'

export interface ScheduleProduct {
    uuid: string
    actual_price: string | null
    product_status: 'none' | 'b1t1' | 'out_of_stock'
    price_confirmed_at: string | null
    product: Product
}

export interface Schedule {
    uuid: string
    title: string
    description: string | null
    pasabuy_schedule_date: string | null
    status: 'open' | 'closed' | 'finished'
    is_open: boolean
    products: ScheduleProduct[]
    created_at: string
}

export interface ScheduleSummaryItem {
    product_uuid: string
    product_name: string
    category_name: string | null
    default_price: string
    total_quantity: number
    subtotal: string
}

export interface ChecklistItem {
    product_uuid: string
    product_name: string
    category_name: string | null
    quantity: number
    is_checked: boolean
    checked_at: string | null
    additional_quantity: number
    return_quantity: number
}

export interface ProductBuyer {
    customer_name: string
    quantity: number
    estimated_price: string
    actual_price: string | null
    subtotal: string
    status: string
}
