export default defineNuxtRouteMiddleware(async (to) => {
    if (import.meta.server) return

    const token = localStorage.getItem('_token')
    if (!token) {
        return navigateTo(`/customer/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    const { user, fetchCurrentUser } = useAuth()
    if (!user.value) {
        try {
            await fetchCurrentUser()
        } catch {
            return navigateTo(`/customer/login?redirect=${encodeURIComponent(to.fullPath)}`)
        }
    }
})
