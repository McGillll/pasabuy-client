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

    async fetchMyOrder(uuid: string): Promise<any> {
        return await this.request(`/customer/orders/${uuid}`, 'GET')
    }

    async updateMyOrder(uuid: string, items: CustomerOrderItemInput[]): Promise<any> {
        return await this.request(`/customer/orders/${uuid}`, 'PUT', { items })
    }

    async cancelOrder(uuid: string): Promise<any> {
        return await this.request(`/customer/orders/${uuid}/cancel`, 'POST')
    }
}

export const customerOrderService = new CustomerOrderService()
