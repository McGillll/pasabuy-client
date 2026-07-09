export interface OrderItem {
    uuid: string
    product_uuid?: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_bonus: boolean
    confirmation_status: 'none' | 'pending' | 'accepted' | 'removed' | 'out_of_stock'
    max_price: string | null
    auto_buy_if_under_max: boolean
    quantity: number
    subtotal: string
}
