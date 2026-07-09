import BaseAPIService from '@/components/api/BaseAPIService'

export interface CustomerOrderItemInput {
    product_uuid: string
    quantity: number
}

/**
 * Authenticated-customer order placement.
 * See api/rsc-doc/customer-api.md for response shapes.
 */
class CustomerOrderService extends BaseAPIService {
    /**
     * POST /api/customer/pasabuy-schedules/{scheduleUuid}/orders
     * FormData fields: items indexed array — `items[i][product_uuid]` (string), `items[i][quantity]` (numeric string).
     * customer_name/customer_contact are snapshotted server-side from the logged-in account, not sent here.
     * Response: created `Order`.
     */
    async placeOrder(scheduleUuid: string, items: CustomerOrderItemInput[]): Promise<any> {
        const formData = new FormData()
        this.appendItems(formData, items)

        return await this.request(`/customer/pasabuy-schedules/${scheduleUuid}/orders`, 'POST', formData)
    }

    /**
     * GET /api/customer/orders
     * Query params: per_page.
     * Response: paginated `{ data: Order[], total, ... }` — the authenticated customer's own orders.
     */
    async fetchMyOrders(params: object = {}): Promise<any> {
        return await this.request('/customer/orders', 'GET', params)
    }

    /**
     * GET /api/customer/orders/{uuid}
     * Response: single `Order` (only if owned by the authenticated customer).
     */
    async fetchMyOrder(uuid: string): Promise<any> {
        return await this.request(`/customer/orders/${uuid}`, 'GET')
    }

    /**
     * PUT /api/customer/orders/{uuid}
     * FormData fields: same indexed items array as placeOrder. Replaces the order's items entirely.
     * Only allowed while the order is pending and its schedule is still open (see `is_editable`).
     * Response: updated `Order`.
     */
    async updateMyOrder(uuid: string, items: CustomerOrderItemInput[]): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PUT')
        this.appendItems(formData, items)

        return await this.request(`/customer/orders/${uuid}`, 'POST', formData)
    }

    /**
     * PATCH /api/customer/orders/{uuid}/cancel (sent as POST with `_method: 'PATCH'` spoofing)
     * Cancels the order outright. Only allowed while status is 'pending'.
     * Response: updated `Order`.
     */
    async cancelOrder(uuid: string): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PATCH')

        return await this.request(`/customer/orders/${uuid}/cancel`, 'POST', formData)
    }

    private appendItems(formData: FormData, items: CustomerOrderItemInput[]) {
        items.forEach((item, index) => {
            formData.append(`items[${index}][product_uuid]`, item.product_uuid)
            formData.append(`items[${index}][quantity]`, String(item.quantity))
        })
    }
}

export const customerOrderService = new CustomerOrderService()
