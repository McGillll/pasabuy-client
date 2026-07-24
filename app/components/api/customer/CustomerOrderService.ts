import BaseAPIService from '@/components/api/BaseAPIService'

export interface CustomerOrderItemInput {
    product_uuid: string
    quantity: number
}

class CustomerOrderService extends BaseAPIService {
    async placeOrder(scheduleUuid: string, items: CustomerOrderItemInput[]): Promise<any> {
        return await this.request(`/customer/pasabuy-schedules/${scheduleUuid}/orders`, 'POST', { items })
    }

    async fetchMyOrders(params: object = {}): Promise<any> {
        return await this.request('/customer/orders', 'GET', params)
    }

    async fetchMyOrdersCacheable(params: object, etag: string | null): Promise<{ data: any; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/customer/orders', params, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }

    async fetchMyOrder(uuid: string): Promise<any> {
        return await this.request(`/customer/orders/${uuid}`, 'GET')
    }

    async fetchMyOrderCacheable(uuid: string, etag: string | null): Promise<{ data: any; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>(`/customer/orders/${uuid}`, {}, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }

    async updateMyOrder(uuid: string, items: CustomerOrderItemInput[]): Promise<any> {
        return await this.request(`/customer/orders/${uuid}`, 'PUT', { items })
    }

    async cancelOrder(uuid: string): Promise<any> {
        return await this.request(`/customer/orders/${uuid}/cancel`, 'POST')
    }

    async fetchInvoice(uuid: string): Promise<any> {
        return await this.request(`/customer/orders/${uuid}/invoice`, 'GET')
    }
}

export const customerOrderService = new CustomerOrderService()
