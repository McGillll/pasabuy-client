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

    async recordPayment(orderUuid: string, payload: OrderPaymentPayload): Promise<any> {
        return await this.request(`/admin/orders/${orderUuid}/payments`, 'POST', payload)
    }

    async deletePayment(orderUuid: string, paymentUuid: string): Promise<any> {
        return await this.request(`/admin/orders/${orderUuid}/payments/${paymentUuid}`, 'DELETE')
    }
}

export const orderService = new OrderService()
