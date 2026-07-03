import BaseAPIService from '@/components/api/BaseAPIService'

export interface PublicOrderItemInput {
    product_uuid: string
    quantity: number
}

export interface PlaceOrderPayload {
    customer_name: string
    customer_contact: string
    items: PublicOrderItemInput[]
}

/**
 * Customer-facing, no-auth endpoints for viewing a pasabuy schedule and placing an order.
 * See api/rsc-doc/public-pasabuy-api.md for response shapes.
 */
class PublicPasabuyService extends BaseAPIService {
    /**
     * GET /api/public/pasabuy-schedules/{uuid}
     * Response: `Schedule` including its attached `products`.
     */
    async fetchSchedule(uuid: string): Promise<any> {
        return await this.request(`/public/pasabuy-schedules/${uuid}`, 'GET')
    }

    /**
     * POST /api/public/pasabuy-schedules/{uuid}/orders
     * FormData fields: customer_name (string, required), customer_contact (string, required),
     * items indexed array — `items[i][product_uuid]` (string), `items[i][quantity]` (numeric string).
     * Response: created `Order`.
     */
    async placeOrder(uuid: string, payload: PlaceOrderPayload): Promise<any> {
        const formData = new FormData()
        formData.append('customer_name', payload.customer_name)
        formData.append('customer_contact', payload.customer_contact)
        payload.items.forEach((item, index) => {
            formData.append(`items[${index}][product_uuid]`, item.product_uuid)
            formData.append(`items[${index}][quantity]`, String(item.quantity))
        })

        return await this.request(`/public/pasabuy-schedules/${uuid}/orders`, 'POST', formData)
    }
}

export const publicPasabuyService = new PublicPasabuyService()
