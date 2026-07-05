import BaseAPIService from '@/components/api/BaseAPIService'

export interface CustomerRegisterPayload {
    first_name: string
    last_name: string
    email: string
    password: string
    password_confirmation: string
    contact_number?: string
    messenger_name?: string
}

/**
 * Public (no-auth) customer registration.
 * See api/rsc-doc/customer-api.md for response shapes.
 */
class PublicCustomerService extends BaseAPIService {
    /**
     * POST /api/public/customers/register
     * FormData fields: first_name, last_name, email, password, password_confirmation (all required),
     * contact_number, messenger_name (optional).
     * Response: created `Customer` (pending admin approval).
     */
    async register(payload: CustomerRegisterPayload): Promise<any> {
        const formData = new FormData()
        formData.append('first_name', payload.first_name)
        formData.append('last_name', payload.last_name)
        formData.append('email', payload.email)
        formData.append('password', payload.password)
        formData.append('password_confirmation', payload.password_confirmation)
        if (payload.contact_number) formData.append('contact_number', payload.contact_number)
        if (payload.messenger_name) formData.append('messenger_name', payload.messenger_name)

        return await this.request('/public/customers/register', 'POST', formData)
    }
}

export const publicCustomerService = new PublicCustomerService()
