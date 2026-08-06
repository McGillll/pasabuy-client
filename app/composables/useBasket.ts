import { customerBasketService } from '@/components/api/customer/CustomerBasketService'
import APIError from '@/components/api/user/APIError'
import type { Basket } from '@/types/Basket'

let etag: string | null = null

export function useBasket() {
    const basket = useState<Basket | null>('customer_basket', () => null)
    const toast = useToast()

    const itemCount = computed(() => basket.value?.total_items ?? 0)

    async function load() {
        try {
            const result = await customerBasketService.fetchMyBasketCacheable(etag)
            if (result === 'not-modified') return
            basket.value = result.data as Basket
            etag = result.etag
        } catch {
            // non-critical: badge/basket page will just show stale or empty state
        }
    }

    async function add(productUuid: string, quantity: number) {
        try {
            const result = await customerBasketService.addToBasket(productUuid, quantity)
            basket.value = result.data as Basket
            etag = null
            return true
        } catch (error) {
            toast.add({ title: 'Failed to add to Blue Basket', description: (error as APIError).message, color: 'error' })
            return false
        }
    }

    async function updateQuantity(itemUuid: string, quantity: number) {
        try {
            const result = await customerBasketService.updateBasketItem(itemUuid, quantity)
            basket.value = result.data as Basket
            etag = null
            return true
        } catch (error) {
            toast.add({ title: 'Failed to update basket', description: (error as APIError).message, color: 'error' })
            return false
        }
    }

    async function remove(itemUuid: string) {
        try {
            const result = await customerBasketService.removeFromBasket(itemUuid)
            basket.value = result.data as Basket
            etag = null
            return true
        } catch (error) {
            toast.add({ title: 'Failed to remove item', description: (error as APIError).message, color: 'error' })
            return false
        }
    }

    async function clear() {
        try {
            const result = await customerBasketService.clearBasket()
            basket.value = result.data as Basket
            etag = null
            return true
        } catch (error) {
            toast.add({ title: 'Failed to clear basket', description: (error as APIError).message, color: 'error' })
            return false
        }
    }

    return { basket, itemCount, load, add, updateQuantity, remove, clear }
}
