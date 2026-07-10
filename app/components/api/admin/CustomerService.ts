import BaseAPIService from '@/components/api/BaseAPIService'

class CustomerService extends BaseAPIService {
    async fetchCustomers(params: object = {}): Promise<any> {
        return await this.request('/admin/customers', 'GET', params)
    }

    async fetchCustomerOrders(uuid: string): Promise<any> {
        return await this.request(`/admin/customers/${uuid}/orders`, 'GET')
    }

    async approveCustomer(uuid: string): Promise<any> {
        return await this.request(`/admin/customers/${uuid}/approve`, 'PATCH')
    }

    async rejectCustomer(uuid: string): Promise<any> {
        return await this.request(`/admin/customers/${uuid}/reject`, 'PATCH')
    }
}

export const customerService = new CustomerService()
