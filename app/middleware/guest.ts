export default defineNuxtRouteMiddleware(async () => {
    if (import.meta.server) return

    const token = localStorage.getItem('_token')
    if (!token) return

    const { user, canAccessAdmin, fetchCurrentUser } = useAuth()
    if (!user.value) {
        try {
            await fetchCurrentUser()
        } catch {
            localStorage.removeItem('_token')
            localStorage.removeItem('rememberMe')
            return
        }
    }

    const homePath = canAccessAdmin.value ? '/admin' : '/customer'
    return navigateTo(homePath)
})
