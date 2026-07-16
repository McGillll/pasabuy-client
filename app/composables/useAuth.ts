import { authService } from '@/components/api/auth/AuthService'
import type { ResetPasswordPayload, VerifyEmailPayload } from '@/components/api/auth/AuthService'
import APIError from '@/components/api/user/APIError'
import type { User } from '@/types/User'

export function useAuth() {
    const user = useState<User | null>('auth_user', () => null)

    async function login(email: string, password: string, remember: boolean = false) {
        const response = await authService.login({ email, password, remember })
        localStorage.setItem('_token', response.data.token)
        if (remember) localStorage.setItem('rememberMe', '1')
        user.value = response.data.user
    }

    async function logout(redirectTo: string | null = '/login') {
        try {
            await authService.logout()
        } catch (error) {
            if (!(error instanceof APIError)) throw error
        }
        localStorage.removeItem('_token')
        localStorage.removeItem('rememberMe')
        user.value = null
        if (redirectTo) navigateTo(redirectTo)
    }

    async function fetchCurrentUser() {
        const response = await authService.me()
        user.value = response.data
        return user.value
    }

    async function forgotPassword(email: string) {
        return await authService.forgotPassword({ email })
    }

    async function resetPassword(payload: ResetPasswordPayload) {
        return await authService.resetPassword(payload)
    }

    async function verifyEmail(payload: VerifyEmailPayload) {
        const response = await authService.verifyEmail(payload)
        if (user.value) user.value = { ...user.value, is_verified: true }
        return response
    }

    async function resendVerificationEmail() {
        return await authService.resendVerificationEmail()
    }

    return { user, login, logout, fetchCurrentUser, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail }
}
