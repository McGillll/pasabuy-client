interface PusherStateChange {
    previous: string
    current: string
}

interface PusherConnection {
    bind(event: 'state_change', callback: (states: PusherStateChange) => void): void
    unbind(event: 'state_change', callback: (states: PusherStateChange) => void): void
}

export interface LiveResyncOptions {
    // Fallback poll while the page is visible, in case the socket is silently dead.
    intervalMs?: number
    // Resync is skipped while this returns false (e.g. live sync not started, or a
    // check-off is still in flight and would be overwritten by stale server data).
    canResync?: () => boolean
}

// Websocket events are not replayed after a dropped connection, so anything broadcast while
// a helper's phone slept in the store is simply lost. This re-runs `resync` whenever updates
// may have been missed: the socket reconnects, the page becomes visible again, the device
// comes back online, plus a slow poll while visible as a safety net.
export function useLiveResync(resync: () => Promise<void>, options: LiveResyncOptions = {}) {
    const intervalMs = options.intervalMs ?? 60 * 1000
    const MIN_GAP_MS = 3000

    let inFlight = false
    let lastRunAt = 0
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let hasConnectedOnce = false
    let connection: PusherConnection | undefined

    async function run() {
        if (inFlight || document.visibilityState !== 'visible') return
        if (options.canResync && !options.canResync()) return
        if (Date.now() - lastRunAt < MIN_GAP_MS) return

        inFlight = true
        lastRunAt = Date.now()
        try {
            await resync()
        } catch {
            // Background resync is best-effort; the next trigger will try again.
        } finally {
            inFlight = false
        }
    }

    function onStateChange({ current }: PusherStateChange) {
        if (current !== 'connected') return
        if (hasConnectedOnce) run()
        hasConnectedOnce = true
    }

    function onVisibilityChange() {
        if (document.visibilityState === 'visible') run()
    }

    const nuxtApp = useNuxtApp()

    onMounted(() => {
        connection = (nuxtApp.$echo.connector as { pusher?: { connection: PusherConnection } }).pusher?.connection
        connection?.bind('state_change', onStateChange)
        document.addEventListener('visibilitychange', onVisibilityChange)
        window.addEventListener('online', run)
        pollTimer = setInterval(run, intervalMs)
    })

    onUnmounted(() => {
        connection?.unbind('state_change', onStateChange)
        document.removeEventListener('visibilitychange', onVisibilityChange)
        window.removeEventListener('online', run)
        if (pollTimer) clearInterval(pollTimer)
    })
}
