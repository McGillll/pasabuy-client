export default defineNuxtRouteMiddleware(async (to) => {
    if (import.meta.server) return

    const token = localStorage.getItem('_token')
    if (!token) {
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    const { user, canAccessCustomer, fetchCurrentUser, logout } = useAuth()
    if (!user.value) {
        try {
            await fetchCurrentUser()
        } catch {
            return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
        }
    }

    if (!canAccessCustomer.value) {
        return navigateTo('/admin')
    }

    if (user.value?.is_approved === false) {
        await logout(null)
        useToast().add({
            title: 'Account pending approval',
            description: 'Your account is pending admin approval. Please try again once approved.',
            color: 'warning'
        })
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
})
