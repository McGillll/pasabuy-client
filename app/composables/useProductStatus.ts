type NotableProductStatus = 'b1t1' | 'out_of_stock'

export const productStatusIcon: Record<NotableProductStatus, string> = {
    b1t1: 'i-lucide-gift',
    out_of_stock: 'i-lucide-ban'
}

export const productStatusIconClass: Record<NotableProductStatus, string> = {
    b1t1: 'bg-success text-inverted',
    out_of_stock: 'bg-error text-inverted'
}

export const productStatusLabel: Record<NotableProductStatus, string> = {
    b1t1: 'Buy 1 Take 1',
    out_of_stock: 'Out of stock'
}

export function useProductStatus() {
    return { productStatusIcon, productStatusIconClass, productStatusLabel }
}
