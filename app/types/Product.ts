import type { Category } from '@/types/Category'
import type { Brand } from '@/types/Brand'

export interface Product {
    uuid: string
    name: string
    description: string | null
    image_url: string | null
    is_active: boolean
    default_price: string
    default_product_status: 'none' | 'b1t1' | 'out_of_stock'
    category: Category | null
    brand: Brand | null
    last_confirmed_price?: string | null
    last_product_status?: 'none' | 'b1t1' | 'out_of_stock' | null
}

export interface TopProduct {
    uuid: string
    name: string
    total_quantity: number
}
