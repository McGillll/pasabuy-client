import BaseAPIService from '@/components/api/BaseAPIService'
import type { SettingsPayload } from '@/types/Settings'

class SettingsService extends BaseAPIService {
    async fetchPublicSettings(): Promise<any> {
        return await this.request('/public/settings', 'GET')
    }

    async updateSettings(payload: SettingsPayload): Promise<any> {
        return await this.request('/admin/settings', 'PATCH', payload)
    }
}

export const settingsService = new SettingsService()
