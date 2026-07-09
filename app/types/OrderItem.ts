export interface OrderItem {
    uuid: string
    product_uuid?: string
    product_name: string
    estimated_price: string
    actual_price: string | null
    is_bonus: boolean
    is_out_of_stock: boolean
    quantity: number
    subtotal: string
}
