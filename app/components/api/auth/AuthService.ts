import BaseAPIService from '@/components/api/BaseAPIService'

export interface LoginPayload {
    email: string
    password: string
    remember?: boolean
}

/**
 * POST /api/auth/login — FormData: email, password, remember?
 * Response data: { user: { uuid, name, email, role }, token }
 */
class AuthService extends BaseAPIService {
    async login(payload: LoginPayload): Promise<any> {
        const formData = new FormData()
        formData.append('email', payload.email)
        formData.append('password', payload.password)
        formData.append('remember', payload.remember ? '1' : '0')

        return await this.request('/auth/login', 'POST', formData)
    }

    async logout(): Promise<any> {
        return await this.request('/auth/logout', 'POST')
    }

    async me(): Promise<any> {
        return await this.request('/auth/me', 'GET')
    }
}

export const authService = new AuthService()
