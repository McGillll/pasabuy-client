import BaseAPIService from '@/components/api/BaseAPIService'

export interface CustomerRegisterPayload {
    first_name: string
    last_name: string
    email: string
    password: string
    password_confirmation: string
    contact_number?: string
    messenger_name?: string
    terms_accepted: boolean
}

class PublicCustomerService extends BaseAPIService {
    async register(payload: CustomerRegisterPayload): Promise<any> {
        return await this.request('/public/customers/register', 'POST', payload)
    }
}

export const publicCustomerService = new PublicCustomerService()
