import BaseAPIService from '@/components/api/BaseAPIService'

class CustomerPasabuyScheduleService extends BaseAPIService {
    async fetchOpenSchedules(params: object = {}): Promise<any> {
        return await this.request('/customer/pasabuy-schedules', 'GET', params)
    }
}

export const customerPasabuyScheduleService = new CustomerPasabuyScheduleService()
