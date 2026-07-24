import BaseAPIService from '@/components/api/BaseAPIService'
import type { SettingsPayload } from '@/types/Settings'

class SettingsService extends BaseAPIService {
    async fetchPublicSettings(): Promise<any> {
        return await this.request('/public/settings', 'GET')
    }

    async fetchPublicSettingsCacheable(etag: string | null): Promise<{ data: any; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/public/settings', {}, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }

    async updateSettings(payload: SettingsPayload): Promise<any> {
        return await this.request('/admin/settings', 'PATCH', payload)
    }
}

export const settingsService = new SettingsService()
