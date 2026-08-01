import BaseAPIService from '@/components/api/BaseAPIService'

export interface OrderPaymentPayload {
    amount: number
    method: 'cash' | 'gcash' | 'bank_transfer' | 'maya' | 'other'
    reference_number?: string
    notes?: string
    paid_at: string
}

class OrderService extends BaseAPIService {
    async fetchOrders(params: object = {}): Promise<any> {
        return await this.request('/admin/orders', 'GET', params)
    }

    async updateDeliveryStatus(uuid: string, deliveryStatus: 'not_delivered' | 'delivered'): Promise<any> {
        return await this.request(`/admin/orders/${uuid}/delivery-status`, 'PATCH', { delivery_status: deliveryStatus })
    }

    async fetchPayments(orderUuid: string): Promise<any> {
        return await this.request(`/admin/orders/${orderUuid}/payments`, 'GET')
    }

    async fetchPaymentsCacheable(orderUuid: string, etag: string | null): Promise<{ data: any; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>(`/admin/orders/${orderUuid}/payments`, {}, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }

    async recordPayment(orderUuid: string, payload: OrderPaymentPayload): Promise<any> {
        return await this.request(`/admin/orders/${orderUuid}/payments`, 'POST', payload)
    }

    async deletePayment(orderUuid: string, paymentUuid: string): Promise<any> {
        return await this.request(`/admin/orders/${orderUuid}/payments/${paymentUuid}`, 'DELETE')
    }

    async fetchInvoice(orderUuid: string): Promise<any> {
        return await this.request(`/admin/orders/${orderUuid}/invoice`, 'GET')
    }
}

export const orderService = new OrderService()
