export default defineNuxtRouteMiddleware(async (to) => {
    if (import.meta.server) return

    const token = localStorage.getItem('_token')
    if (!token) {
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    const { user, canAccessAdmin, fetchCurrentUser } = useAuth()
    if (!user.value) {
        try {
            await fetchCurrentUser()
        } catch {
            return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
        }
    }

    if (!canAccessAdmin.value) {
        return navigateTo('/customer')
    }
})
