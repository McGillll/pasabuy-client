export default defineNuxtRouteMiddleware(async () => {
    if (import.meta.server) return

    const token = localStorage.getItem('_token')
    if (!token) return

    const { user, fetchCurrentUser } = useAuth()
    if (!user.value) {
        try {
            await fetchCurrentUser()
        } catch {
            localStorage.removeItem('_token')
            localStorage.removeItem('rememberMe')
            return
        }
    }

    const homePath = user.value?.role === 'admin' ? '/admin' : '/customer'
    return navigateTo(homePath)
})
