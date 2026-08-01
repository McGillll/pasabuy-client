import BaseAPIService from '@/components/api/BaseAPIService'

export interface PublicConfirmPricePayload {
    actual_price?: number
    product_status: 'none' | 'b1t1' | 'out_of_stock'
}

class PublicChecklistService extends BaseAPIService {
    async fetchChecklist(token: string): Promise<any> {
        return await this.request(`/public/checklist/${token}`, 'GET')
    }

    async toggleChecklistItem(token: string, productUuid: string, isChecked: boolean): Promise<any> {
        return await this.request(`/public/checklist/${token}/${productUuid}`, 'PATCH', { is_checked: isChecked })
    }

    async confirmPrice(token: string, productUuid: string, payload: PublicConfirmPricePayload): Promise<any> {
        return await this.request(`/public/checklist/${token}/${productUuid}/confirm-price`, 'PATCH', payload)
    }
}

export const publicChecklistService = new PublicChecklistService()
