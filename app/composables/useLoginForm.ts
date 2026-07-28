import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import APIError from '@/components/api/user/APIError'

export function useLoginForm() {
    const { login, user, logout } = useAuth()
    const route = useRoute()

    const state = reactive({
        email: '',
        password: '',
        rememberMe: false
    })

    const isSubmitting = ref(false)
    const authError = ref<string | null>(null)
    const emailError = ref<string | null>(null)
    const passwordError = ref<string | null>(null)

    function validate(state: { email: string, password: string }): FormError[] {
        const errors: FormError[] = []
        if (!state.email) errors.push({ name: 'email', message: 'Email is required' })
        if (!state.password) errors.push({ name: 'password', message: 'Password is required' })
        return errors
    }

    async function onSubmit(event: FormSubmitEvent<typeof state>) {
        isSubmitting.value = true
        authError.value = null
        emailError.value = null
        passwordError.value = null
        try {
            await login(event.data.email, event.data.password, state.rememberMe)

            if (user.value?.is_approved === false) {
                await logout(null)
                authError.value = 'Your account is pending admin approval. Please try again once approved.'
                return
            }

            const homePath = user.value?.role === 'admin' ? '/admin' : '/customer'
            const redirect = route.query.redirect as string | undefined
            const target = redirect && redirect.startsWith(homePath) ? redirect : homePath
            await navigateTo(target)
        } catch (error) {
            if (error instanceof APIError && error.errors) {
                emailError.value = error.errors.email?.[0] ?? null
                passwordError.value = error.errors.password?.[0] ?? null
            } else {
                authError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
            }
        } finally {
            isSubmitting.value = false
        }
    }

    return { state, isSubmitting, authError, emailError, passwordError, validate, onSubmit }
}
