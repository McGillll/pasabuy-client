import BaseAPIService from '@/components/api/BaseAPIService'

/**
 * POST /api/auth/login — FormData: email, password, remember?
 * Response data: { user: { uuid, name, email, role }, token }
 */
class AuthService extends BaseAPIService {
    async login(email: string, password: string, remember: boolean = false): Promise<any> {
        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)
        formData.append('remember', remember ? '1' : '0')

        return await this.requestFormData('/auth/login', formData)
    }

    async logout(): Promise<any> {
        return await this.request('/auth/logout', 'POST')
    }

    async me(): Promise<any> {
        return await this.request('/auth/me', 'GET')
    }
}

export const authService = new AuthService()
