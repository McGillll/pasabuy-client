import BaseAPIService from '@/components/api/BaseAPIService'

class DailyVerseService extends BaseAPIService {
    async fetchToday(): Promise<any> {
        return await this.request('/daily-verse', 'GET')
    }
}

export const dailyVerseService = new DailyVerseService()
