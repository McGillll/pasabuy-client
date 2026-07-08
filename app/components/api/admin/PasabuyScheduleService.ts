import BaseAPIService from '@/components/api/BaseAPIService'

export interface SchedulePayload {
    title: string
    description?: string
    cutoff_at?: string | null
    status?: 'draft' | 'open' | 'closed'
}

export interface ConfirmPricePayload {
    actual_price?: number
    promo_status: 'none' | 'b1t1' | 'out_of_stock'
}

export interface AdminOrderItemInput {
    product_uuid: string
    quantity: number
}

/**
 * Admin pasabuy schedule CRUD + product sync + order listing.
 * See api/rsc-doc/pasabuy-schedule-api.md and order-api.md for response shapes.
 */
class PasabuyScheduleService extends BaseAPIService {
    /**
     * GET /api/admin/pasabuy-schedules
     * Query params: page, per_page.
     * Response: paginated `{ data: Schedule[], total, ... }`.
     */
    async fetchSchedules(params: object = {}): Promise<any> {
        return await this.request('/admin/pasabuy-schedules', 'GET', params)
    }

    /**
     * GET /api/admin/pasabuy-schedules/{uuid}
     * Response: single `Schedule` including its attached `products`.
     */
    async fetchSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'GET')
    }

    /**
     * POST /api/admin/pasabuy-schedules
     * FormData fields: title (string, required), description (string, optional),
     * cutoff_at (string, optional), status ('draft'|'open'|'closed', optional).
     * Response: created `Schedule`.
     */
    async createSchedule(payload: SchedulePayload): Promise<any> {
        return await this.request('/admin/pasabuy-schedules', 'POST', this.buildFormData(payload))
    }

    /**
     * PUT /api/admin/pasabuy-schedules/{uuid} (sent as POST with `_method: 'PUT'` spoofing)
     * FormData fields: same as createSchedule.
     * Response: updated `Schedule`.
     */
    async updateSchedule(uuid: string, payload: SchedulePayload): Promise<any> {
        const formData = this.buildFormData(payload)
        formData.append('_method', 'PUT')

        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'POST', formData)
    }

    /**
     * DELETE /api/admin/pasabuy-schedules/{uuid}
     */
    async deleteSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}`, 'DELETE')
    }

    /**
     * POST /api/admin/pasabuy-schedules/{uuid}/close
     * No body fields. Response: updated `Schedule` (status: 'closed').
     */
    async closeSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/close`, 'POST', new FormData())
    }

    /**
     * POST /api/admin/pasabuy-schedules/{uuid}/reopen
     * No body fields. Response: updated `Schedule` (status: 'open').
     */
    async reopenSchedule(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/reopen`, 'POST', new FormData())
    }

    /**
     * PUT /api/admin/pasabuy-schedules/{uuid}/products (sent as POST with `_method: 'PUT'` spoofing)
     * Replaces the full set of products attached to the schedule — pricing always comes from
     * each product's own `default_price`, so only the product identity is sent.
     * FormData fields: indexed array per product — `products[i][product_uuid]` (string).
     * Response: updated `Schedule` including its attached `products`.
     */
    async syncProducts(uuid: string, productUuids: string[]): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PUT')
        productUuids.forEach((productUuid, index) => {
            formData.append(`products[${index}][product_uuid]`, productUuid)
        })

        return await this.request(`/admin/pasabuy-schedules/${uuid}/products`, 'POST', formData)
    }

    /**
     * PATCH /api/admin/pasabuy-schedules/{uuid}/schedule-products/{scheduleProductUuid}/confirm-price
     * (sent as POST with `_method: 'PATCH'` spoofing)
     * Sets the seller's in-store actual price + promo status for one schedule product.
     * FormData fields: actual_price (numeric string, required unless promo_status is out_of_stock),
     * promo_status ('none'|'b1t1'|'out_of_stock', required).
     * Response: `{ schedule_product: ScheduleProduct, summary: { auto_applied, needs_confirmation, bonus_applied } }`.
     */
    async confirmProductPrice(uuid: string, scheduleProductUuid: string, payload: ConfirmPricePayload): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PATCH')
        if (payload.actual_price !== undefined) formData.append('actual_price', String(payload.actual_price))
        formData.append('promo_status', payload.promo_status)

        return await this.request(`/admin/pasabuy-schedules/${uuid}/schedule-products/${scheduleProductUuid}/confirm-price`, 'POST', formData)
    }

    /**
     * GET /api/admin/pasabuy-schedules/{uuid}/orders
     * Response: `Order[]` for the schedule.
     */
    async fetchOrders(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/orders`, 'GET')
    }

    /**
     * PATCH /api/admin/orders/{uuid}/status (sent as POST with `_method: 'PATCH'` spoofing)
     * FormData fields: status ('confirmed'|'cancelled', required).
     * Response: updated `Order`.
     */
    async updateOrderStatus(uuid: string, status: 'confirmed' | 'cancelled'): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PATCH')
        formData.append('status', status)

        return await this.request(`/admin/orders/${uuid}/status`, 'POST', formData)
    }

    /**
     * GET /api/admin/pasabuy-schedules/{uuid}/summary
     * Response: `Array<{ product_uuid, product_name, category_name, default_price, total_quantity, subtotal }>`.
     * Sum `subtotal` client-side for a grand total.
     */
    async fetchScheduleSummary(uuid: string): Promise<any> {
        return await this.request(`/admin/pasabuy-schedules/${uuid}/summary`, 'GET')
    }

    /**
     * PUT /api/admin/pasabuy-schedules/{scheduleUuid}/orders/{orderUuid}/items
     * (sent as POST with `_method: 'PUT'` spoofing)
     * Seller-only full item-list replacement, only permitted while the schedule is closed.
     * FormData fields: indexed array — `items[i][product_uuid]`, `items[i][quantity]`.
     * Response: updated `Order` (items/subtotal/total recomputed).
     */
    async updateOrderItems(scheduleUuid: string, orderUuid: string, items: AdminOrderItemInput[]): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PUT')
        items.forEach((item, index) => {
            formData.append(`items[${index}][product_uuid]`, item.product_uuid)
            formData.append(`items[${index}][quantity]`, String(item.quantity))
        })

        return await this.request(`/admin/pasabuy-schedules/${scheduleUuid}/orders/${orderUuid}/items`, 'POST', formData)
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
