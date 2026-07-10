import BaseAPIService from '@/components/api/BaseAPIService'

class PublicPasabuyService extends BaseAPIService {
    async fetchSchedule(uuid: string): Promise<any> {
        return await this.request(`/public/pasabuy-schedules/${uuid}`, 'GET')
    }
}

export const publicPasabuyService = new PublicPasabuyService()
