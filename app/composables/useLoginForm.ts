import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import APIError from '@/components/api/user/APIError'

export function useLoginForm(defaultRedirect: string) {
    const { login } = useAuth()
    const route = useRoute()

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
            const redirect = (route.query.redirect as string) || defaultRedirect
            await navigateTo(redirect)
        } catch (error) {
            authError.value = error instanceof APIError ? error.message : 'Something went wrong. Please try again.'
        } finally {
            isSubmitting.value = false
        }
    }

    return { state, isSubmitting, authError, validate, onSubmit }
}
