import BaseAPIService from '@/components/api/BaseAPIService'

export interface SchedulePayload {
    title: string
    description?: string
    pasabuy_schedule_date: string
    status?: 'open' | 'closed' | 'finished'
}

export interface ConfirmPricePayload {
    actual_price?: number
    product_status: 'none' | 'b1t1' | 'out_of_stock'
}

export interface AdminOrderItemInput {
    product_uuid: string
    quantity: number
}

class PasabuyScheduleService extends BaseAPIService {
    async fetchSchedules(params: object = {}): Promise<any> {
        return await this.request('/admin/pasabuy-schedules', 'GET', params)
    }

    async fetchSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'GET')
    }

    async createSchedule(payload: SchedulePayload): Promise<any> {
        return await this.request('/admin/pasabuy-schedules', 'POST', payload)
    }

    async updateSchedule(uuid: string, payload: SchedulePayload): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'PUT', payload)
    }

    async deleteSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'DELETE')
    }

    async closeSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/close`, 'POST')
    }

    async reopenSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/reopen`, 'POST')
    }

    async finishSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/finish`, 'POST')
    }

    async confirmProductPrice(uuid: string, scheduleProductUuid: string, payload: ConfirmPricePayload): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/schedule-products/${scheduleProductUuid}/confirm-price`, 'PATCH', payload)
    }

    async fetchProductBuyers(uuid: string, productUuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/products/${productUuid}/buyers`, 'GET')
    }

    async fetchChecklist(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/checklist`, 'GET')
    }

    async toggleChecklistItem(uuid: string, productUuid: string, isChecked: boolean): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/checklist/${productUuid}`, 'PATCH', { is_checked: isChecked })
    }

    async regenerateChecklist(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/checklist/regenerate`, 'POST')
    }

    async fetchChecklistShareLink(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/checklist/share-link`, 'GET')
    }

    async regenerateChecklistShareLink(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/checklist/share-link/regenerate`, 'POST')
    }

    async fetchOrders(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/orders`, 'GET')
    }

    async updateOrderStatus(uuid: string, status: 'confirmed' | 'cancelled'): Promise<any> {
        return await this.request(`/admin/orders/${uuid}/status`, 'PATCH', { status })
    }

    async fetchScheduleSummary(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/summary`, 'GET')
    }

    async updateOrderItems(scheduleUuid: string, orderUuid: string, items: AdminOrderItemInput[]): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${scheduleUuid}/orders/${orderUuid}/items`, 'PUT', { items })
    }
}

export const pasabuyScheduleService = new PasabuyScheduleService()
