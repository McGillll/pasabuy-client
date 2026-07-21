import BaseAPIService from '@/components/api/BaseAPIService'

export interface LoginPayload {
    email: string
    password: string
    remember?: boolean
}

export interface UpdateProfilePayload {
    first_name: string
    last_name: string
    email: string
}

export interface UpdatePasswordPayload {
    current_password: string
    password: string
    password_confirmation: string
}

export interface ForgotPasswordPayload {
    email: string
}

export interface ResetPasswordPayload {
    token: string
    email: string
    password: string
    password_confirmation: string
}

export interface VerifyEmailPayload {
    token: string
}

class AuthService extends BaseAPIService {
    async login(payload: LoginPayload): Promise<any> {
        return await this.request('/auth/login', 'POST', payload)
    }

    async forgotPassword(payload: ForgotPasswordPayload): Promise<any> {
        return await this.request('/auth/forgot-password', 'POST', payload)
    }

    async resetPassword(payload: ResetPasswordPayload): Promise<any> {
        return await this.request('/auth/reset-password', 'POST', payload)
    }

    async logout(): Promise<any> {
        return await this.request('/auth/logout', 'POST')
    }

    async me(): Promise<any> {
        return await this.request('/auth/me', 'GET')
    }

    async updateProfile(payload: UpdateProfilePayload): Promise<any> {
        return await this.request('/auth/me', 'PATCH', payload)
    }

    async updatePassword(payload: UpdatePasswordPayload): Promise<any> {
        return await this.request('/auth/me/password', 'PATCH', payload)
    }

    async verifyEmail(payload: VerifyEmailPayload): Promise<any> {
        return await this.request('/auth/email/verify', 'POST', payload)
    }

    async resendVerificationEmail(): Promise<any> {
        return await this.request('/auth/email/verification-notification', 'POST')
    }
}

export const authService = new AuthService()
