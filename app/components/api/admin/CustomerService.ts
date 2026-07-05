import BaseAPIService from '@/components/api/BaseAPIService'

/**
 * Admin customer directory + per-customer order history.
 * See api/rsc-doc/customer-api.md for response shapes.
 */
class CustomerService extends BaseAPIService {
    /**
     * GET /api/admin/customers
     * Query params: search, is_approved, page, per_page.
     * Response: paginated `{ data: Customer[], total, ... }`.
     */
    async fetchCustomers(params: object = {}): Promise<any> {
        return await this.request('/admin/customers', 'GET', params)
    }

    /**
     * GET /api/admin/customers/{uuid}/orders
     * Response: `Order[]` (not paginated) for that customer, across all schedules.
     */
    async fetchCustomerOrders(uuid: string): Promise<any> {
        return await this.request(`/admin/customers/${uuid}/orders`, 'GET')
    }

    /**
     * POST /api/admin/customers/{uuid}/approve
     * Flips is_approved to true, stamps approved_at.
     * Response: updated `Customer`.
     */
    async approveCustomer(uuid: string): Promise<any> {
        return await this.request(`/admin/customers/${uuid}/approve`, 'POST')
    }

    /**
     * POST /api/admin/customers/{uuid}/reject
     * Sets is_approved back to false, clears approved_at.
     * Response: updated `Customer`.
     */
    async rejectCustomer(uuid: string): Promise<any> {
        return await this.request(`/admin/customers/${uuid}/reject`, 'POST')
    }
}

export const customerService = new CustomerService()
