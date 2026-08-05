/**
 * Prefers real browser-history back over a fresh navigation when the previous
 * history entry is the same target, so scroll position and filters survive.
 * Falls back to a normal navigation when there is no matching history entry
 * (e.g. a direct or shared link).
 */
export function useSmartBack() {
    const router = useRouter()

    function goBack(to: string) {
        const state = window.history.state as { back?: string | null } | null
        if (state?.back === to) {
            router.back()
        } else {
            navigateTo(to)
        }
    }

    return { goBack }
}
