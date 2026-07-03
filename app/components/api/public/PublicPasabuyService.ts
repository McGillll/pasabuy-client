import BaseAPIService from '@/components/api/BaseAPIService'

export interface PublicOrderItemInput {
    product_uuid: string
    quantity: number
}

/**
 * Customer-facing, no-auth endpoints for viewing a pasabuy schedule and placing an order.
 * See api/rsc-doc/public-pasabuy-api.md for response shapes.
 */
class PublicPasabuyService extends BaseAPIService {
    async fetchSchedule(uuid: string): Promise<any> {
        return await this.request(`/public/pasabuy-schedules/${uuid}`, 'GET')
    }

    async placeOrder(uuid: string, customerName: string, customerContact: string, items: PublicOrderItemInput[]): Promise<any> {
        const formData = new FormData()
        formData.append('customer_name', customerName)
        formData.append('customer_contact', customerContact)
        items.forEach((item, index) => {
            formData.append(`items[${index}][product_uuid]`, item.product_uuid)
            formData.append(`items[${index}][quantity]`, String(item.quantity))
        })

        return await this.request(`/public/pasabuy-schedules/${uuid}/orders`, 'POST', formData)
    }
}

export const publicPasabuyService = new PublicPasabuyService()
