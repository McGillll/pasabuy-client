export interface UndoableActionOptions {
    label: string
    undoLabel?: string
    durationMs?: number
    apply: () => void
    revert: () => void
    commit: () => Promise<void>
    onError?: (error: unknown) => void
}

export function useUndoableAction() {
    const toast = useToast()
    const pendingCommits = new Set<() => void>()

    function flushPendingCommits() {
        // The page is actually being torn down (closed, navigated away from, or the
        // browser is done with it): fire every still-pending commit right now instead of
        // waiting out the undo window, so a closed tab doesn't silently drop it. `pagehide`
        // fires only on genuine navigation/close, not on ordinary backgrounding, so a user
        // switching apps or locking their phone mid-undo-window still gets the full window.
        const flushers = [...pendingCommits]
        pendingCommits.clear()
        flushers.forEach((flush) => flush())
    }

    if (import.meta.client) {
        onMounted(() => window.addEventListener('pagehide', flushPendingCommits))
        onUnmounted(() => window.removeEventListener('pagehide', flushPendingCommits))
    }

    function runUndoable(options: UndoableActionOptions) {
        const durationMs = options.durationMs ?? 4000
        let settled = false

        options.apply()

        async function commitNow() {
            if (settled) return
            settled = true
            pendingCommits.delete(commitNow)
            clearTimeout(timer)
            try {
                await options.commit()
            } catch (error) {
                options.revert()
                options.onError?.(error)
            }
        }

        const timer = setTimeout(commitNow, durationMs)
        pendingCommits.add(commitNow)

        toast.add({
            title: options.label,
            duration: durationMs,
            actions: [{
                label: options.undoLabel ?? 'Undo',
                onClick: () => {
                    if (settled) return
                    settled = true
                    pendingCommits.delete(commitNow)
                    clearTimeout(timer)
                    options.revert()
                }
            }]
        })
    }

    return { runUndoable }
}
