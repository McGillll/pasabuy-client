import type { Category } from '@/types/Category'

export interface Product {
    uuid: string
    name: string
    description: string | null
    image_url: string | null
    is_active: boolean
    default_price: string
    category: Category | null
    last_confirmed_price?: string | null
    last_promo_status?: 'none' | 'b1t1' | 'out_of_stock' | null
}
