import BaseAPIService from '@/components/api/BaseAPIService'

class CustomerBasketService extends BaseAPIService {
    async fetchMyBasket(): Promise<any> {
        return await this.request('/customer/basket', 'GET')
    }

    async fetchMyBasketCacheable(etag: string | null): Promise<{ data: any; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/customer/basket', {}, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }

    async addToBasket(productUuid: string, quantity: number): Promise<any> {
        return await this.request('/customer/basket/items', 'POST', { product_uuid: productUuid, quantity })
    }

    async updateBasketItem(itemUuid: string, quantity: number): Promise<any> {
        return await this.request(`/customer/basket/items/${itemUuid}`, 'PATCH', { quantity })
    }

    async removeFromBasket(itemUuid: string): Promise<any> {
        return await this.request(`/customer/basket/items/${itemUuid}`, 'DELETE')
    }

    async clearBasket(): Promise<any> {
        return await this.request('/customer/basket', 'DELETE')
    }
}

export const customerBasketService = new CustomerBasketService()
