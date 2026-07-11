import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import APIError from '@/components/api/user/APIError'

const roleLoginPaths: Record<string, string> = {
    admin: '/login',
    customer: '/customer/login'
}

export function useLoginForm(defaultRedirect: string, expectedRole?: string) {
    const { login, user, logout } = useAuth()
    const route = useRoute()
    const toast = useToast()

    const state = reactive({
        email: '',
        password: '',
        rememberMe: false
    })

    const isSubmitting = ref(false)
    const authError = ref<string | null>(null)

    function validate(state: { email: string, password: string }): FormError[] {
        const errors: FormError[] = []
        if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
        if (!state.password) errors.push({ name: 'password', message: 'Password is required' })
        return errors
    }

    async function onSubmit(event: FormSubmitEvent<typeof state>) {
        isSubmitting.value = true
        authError.value = null
        try {
            await login(event.data.email, event.data.password, state.rememberMe)

            if (expectedRole && user.value?.role !== expectedRole) {
                const properLoginPath = user.value?.role ? roleLoginPaths[user.value.role] : undefined
                await logout(null)
                toast.add({
                    title: 'Wrong sign-in page',
                    description: 'These credentials belong to a different account type. Redirecting you to the correct sign-in page.',
                    color: 'warning'
                })
                const target = properLoginPath ?? defaultRedirect
                const existingRedirect = route.query.redirect as string | undefined
                await navigateTo(existingRedirect ? `${target}?redirect=${encodeURIComponent(existingRedirect)}` : target)
                return
            }

            if (user.value?.is_approved === false) {
                await logout(null)
                authError.value = 'Your account is pending admin approval. Please try again once approved.'
                return
            }

            const redirect = route.query.redirect as string | undefined
            const target = redirect && redirect.startsWith(defaultRedirect) ? redirect : defaultRedirect
            await navigateTo(target)
        } catch (error) {
            authError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
        } finally {
            isSubmitting.value = false
        }
    }

    return { state, isSubmitting, authError, validate, onSubmit }
}
