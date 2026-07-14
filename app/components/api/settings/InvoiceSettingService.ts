import BaseAPIService from '@/components/api/BaseAPIService'
import type { InvoiceSettingPayload } from '@/types/InvoiceSetting'

class InvoiceSettingService extends BaseAPIService {
    async fetchInvoiceSettings(): Promise<any> {
        return await this.request('/admin/invoice-settings', 'GET')
    }

    async updateInvoiceSettings(payload: InvoiceSettingPayload): Promise<any> {
        return await this.request('/admin/invoice-settings', 'PATCH', payload)
    }
}

export const invoiceSettingService = new InvoiceSettingService()
