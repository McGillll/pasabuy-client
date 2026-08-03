import type { Product } from '@/types/Product'

export function useProductPreviewCache() {
    const cache = useState<Record<string, Product>>('product-preview-cache', () => ({}))

    function set(product: Product) {
        cache.value[product.uuid] = product
    }

    function get(uuid: string): Product | null {
        return cache.value[uuid] ?? null
    }

    return { set, get }
}
