export interface BasketItem {
    uuid: string
    product_uuid: string
    product_name: string
    product_image_url: string | null
    price: string
    quantity: number
    subtotal: number
}

export interface Basket {
    uuid: string
    items: BasketItem[]
    total_items: number
    total_amount: number
}
