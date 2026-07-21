const STORAGE_KEY = 'cookie_consent'

export interface CookieConsentPreferences {
    essential: true
    analytics: boolean
}

interface StoredCookieConsent {
    preferences: CookieConsentPreferences
    decidedAt: string
}

export function useCookieConsent() {
    const preferences = useState<CookieConsentPreferences | null>('cookie_consent_preferences', () => null)
    const isBannerVisible = useState<boolean>('cookie_consent_banner_visible', () => false)

    function loadStored(): StoredCookieConsent | null {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        try {
            return JSON.parse(raw) as StoredCookieConsent
        } catch {
            return null
        }
    }

    function init() {
        const stored = loadStored()
        if (stored) {
            preferences.value = stored.preferences
            isBannerVisible.value = false
        } else {
            isBannerVisible.value = true
        }
    }

    function save(next: CookieConsentPreferences) {
        preferences.value = next
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            preferences: next,
            decidedAt: new Date().toISOString(),
        } satisfies StoredCookieConsent))
        isBannerVisible.value = false
    }

    function acceptAll() {
        save({ essential: true, analytics: true })
    }

    function acceptEssentialOnly() {
        save({ essential: true, analytics: false })
    }

    function savePreferences(analytics: boolean) {
        save({ essential: true, analytics })
    }

    function reopenBanner() {
        isBannerVisible.value = true
    }

    return { preferences, isBannerVisible, init, acceptAll, acceptEssentialOnly, savePreferences, reopenBanner }
}
