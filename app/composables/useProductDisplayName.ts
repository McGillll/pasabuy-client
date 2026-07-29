import type { Product } from '@/types/Product'

export function useProductDisplayName() {
    function displayName(product: Product | null | undefined): string {
        if (!product) return ''
        if (!product.brand || product.brand.name.trim().toLowerCase() === product.name.trim().toLowerCase()) {
            return product.name
        }
        return `${product.brand.name} ${product.name}`
    }

    return { displayName }
}
