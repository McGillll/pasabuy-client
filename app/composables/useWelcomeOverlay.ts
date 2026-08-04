import { dailyVerseService } from '@/components/api/DailyVerseService'

const GRACE_MS = 1200

type Verse = { reference: string | null, text: string | null }

const pendingWelcome = ref(false)
const welcomeVerse = reactive<Verse>({ reference: null, text: null })

let versePromise: Promise<Verse | null> | null = null

function requestVerse(): Promise<Verse | null> {
    return dailyVerseService.fetchToday()
        .then((response: { data: Verse }) => response.data)
        .catch(() => null)
}

export function useWelcomeOverlay() {
    return pendingWelcome
}

export function useWelcomeVerse() {
    return welcomeVerse
}

/**
 * Kicks off the verse fetch as early as possible (the login page calls this
 * on mount, while the customer is still typing their credentials) so it has
 * already resolved by the time login succeeds. Memoized: a later call just
 * reuses the in-flight/settled request instead of firing a second one.
 */
export function prefetchWelcomeVerse() {
    if (!versePromise) versePromise = requestVerse()
}

/**
 * Arms the overlay only once the verse is actually in hand, so it can never
 * mount mid-fetch (a swipe during a loading state would clear it before the
 * customer reads anything). Grace period is measured from THIS call, not
 * from when the fetch started, so a verse that was prefetched early costs
 * ~0ms here; the grace period only matters as a fallback when nothing was
 * prefetched yet.
 */
export async function prepareWelcomeOverlay() {
    prefetchWelcomeVerse()

    const result = await Promise.race([
        versePromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), GRACE_MS))
    ])

    if (!result?.text) return

    welcomeVerse.reference = result.reference
    welcomeVerse.text = result.text
    pendingWelcome.value = true
}
