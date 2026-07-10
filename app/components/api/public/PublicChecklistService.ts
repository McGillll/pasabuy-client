import BaseAPIService from '@/components/api/BaseAPIService'

class PublicChecklistService extends BaseAPIService {
    async fetchChecklist(token: string): Promise<any> {
        return await this.request(`/public/checklist/${token}`, 'GET')
    }

    async toggleChecklistItem(token: string, productUuid: string, isChecked: boolean): Promise<any> {
        return await this.request(`/public/checklist/${token}/${productUuid}`, 'PATCH', { is_checked: isChecked })
    }
}

export const publicChecklistService = new PublicChecklistService()
