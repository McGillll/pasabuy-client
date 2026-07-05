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
        items.forEach((item, index) => {
            formData.append(`items[${index}][product_uuid]`, item.product_uuid)
            formData.append(`items[${index}][quantity]`, String(item.quantity))
        })

        return await this.request(`/customer/pasabuy-schedules/${scheduleUuid}/orders`, 'POST', formData)
    }
}

export const customerOrderService = new CustomerOrderService()
