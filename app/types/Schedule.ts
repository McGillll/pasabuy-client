import type { Product } from '@/types/Product'

export interface ScheduleProduct {
    uuid: string
    actual_price: string | null
    promo_status: 'none' | 'b1t1' | 'out_of_stock'
    price_confirmed_at: string | null
    product: Product
}

export interface Schedule {
    uuid: string
    title: string
    description: string | null
    cutoff_at: string | null
    status: 'draft' | 'open' | 'closed'
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
