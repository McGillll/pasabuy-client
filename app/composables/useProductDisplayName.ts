import type { Product } from '@/types/Product'

export function useProductDisplayName() {
    function displayName(product: Product | null | undefined): string {
        return product?.name ?? ''
    }

    return { displayName }
}
