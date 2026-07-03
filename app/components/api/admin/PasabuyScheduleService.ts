import BaseAPIService from '@/components/api/BaseAPIService'

export interface SchedulePayload {
    title: string
    description?: string
    cutoff_at?: string | null
    status?: 'draft' | 'open' | 'closed'
}

export interface ScheduleProductInput {
    product_uuid: string
    price: number
    max_quantity: number | null
}

/**
 * Admin pasabuy schedule CRUD + product sync + order listing.
 * See api/rsc-doc/pasabuy-schedule-api.md and order-api.md for response shapes.
 */
class PasabuyScheduleService extends BaseAPIService {
    async fetchSchedules(params: object = {}): Promise<any> {
        return await this.request('/admin/pasabuy-schedules', 'GET', params)
    }

    async fetchSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'GET')
    }

    async createSchedule(payload: SchedulePayload): Promise<any> {
        return await this.request('/admin/pasabuy-schedules', 'POST', this.buildFormData(payload))
    }

    async updateSchedule(uuid: string, payload: SchedulePayload): Promise<any> {
        const formData = this.buildFormData(payload)
        formData.append('_method', 'PUT')

        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'POST', formData)
    }

    async deleteSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'DELETE')
    }

    async syncProducts(uuid: string, products: ScheduleProductInput[]): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PUT')
        products.forEach((product, index) => {
            formData.append(`products[${index}][product_uuid]`, product.product_uuid)
            formData.append(`products[${index}][price]`, String(product.price))
            if (product.max_quantity !== null) {
                formData.append(`products[${index}][max_quantity]`, String(product.max_quantity))
            }
        })

        return await this.request(`/admin/pasabuy-schedules/${uuid}/products`, 'POST', formData)
    }

    async fetchOrders(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/orders`, 'GET')
    }

    async updateOrderStatus(uuid: string, status: 'confirmed' | 'cancelled'): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PATCH')
        formData.append('status', status)

        return await this.request(`/admin/orders/${uuid}/status`, 'POST', formData)
    }

    private buildFormData(payload: SchedulePayload): FormData {
        const formData = new FormData()
        formData.append('title', payload.title)
        if (payload.description) formData.append('description', payload.description)
        if (payload.cutoff_at) formData.append('cutoff_at', payload.cutoff_at)
        if (payload.status) formData.append('status', payload.status)

        return formData
    }
}

export const pasabuyScheduleService = new PasabuyScheduleService()
