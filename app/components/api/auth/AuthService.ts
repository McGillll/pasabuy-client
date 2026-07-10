import BaseAPIService from '@/components/api/BaseAPIService'

export interface LoginPayload {
    email: string
    password: string
    remember?: boolean
}

class AuthService extends BaseAPIService {
    async login(payload: LoginPayload): Promise<any> {
        return await this.request('/auth/login', 'POST', payload)
    }

    async logout(): Promise<any> {
        return await this.request('/auth/logout', 'POST')
    }

    async me(): Promise<any> {
        return await this.request('/auth/me', 'GET')
    }
}

export const authService = new AuthService()
