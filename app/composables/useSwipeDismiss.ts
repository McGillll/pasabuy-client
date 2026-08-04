/**
 * Vertical counterpart to useSwipeTabs: drags a panel up via direct inline-style
 * transform (compositor-only, no Vue re-render per touchmove tick), commits to an
 * animated exit past the threshold, snaps back otherwise. Exit can also be
 * triggered programmatically (e.g. a "Continue" button) so it plays the same
 * animation as a completed swipe.
 */
export function useSwipeDismiss(onDismiss: () => void) {
    const threshold = 90
    const dragging = ref(false)
    const exiting = ref(false)
    const panelEl = ref<HTMLElement | null>(null)

    let startX = 0
    let startY = 0
    let axisLocked: 'x' | 'y' | null = null
    let offset = 0

    function applyDrag(deltaY: number, withTransition: boolean) {
        const el = panelEl.value
        if (!el) return
        const progress = Math.min(Math.abs(deltaY) / (threshold * 2.5), 1)
        el.style.transition = withTransition ? 'transform 240ms ease, opacity 240ms ease' : 'none'
        el.style.transform = `translateY(${deltaY}px)`
        el.style.opacity = String(1 - progress * 0.5)
    }

    function reset(withTransition: boolean) {
        offset = 0
        applyDrag(0, withTransition)
    }

    function triggerExit() {
        if (exiting.value) return
        exiting.value = true
        const el = panelEl.value
        const exitDistance = Math.max(window.innerHeight, 480)
        if (el) {
            el.style.transition = 'transform 280ms ease, opacity 280ms ease'
            el.style.transform = `translateY(-${exitDistance}px)`
            el.style.opacity = '0'
        }
        window.setTimeout(onDismiss, 280)
    }

    function onTouchStart(event: TouchEvent) {
        if (event.touches.length !== 1 || exiting.value) return
        if ((event.target as HTMLElement | null)?.closest('[data-swipe-ignore]')) return
        startX = event.touches[0]!.clientX
        startY = event.touches[0]!.clientY
        axisLocked = null
        dragging.value = true
    }

    function onTouchMove(event: TouchEvent) {
        if (!dragging.value) return
        const touch = event.touches[0]!
        const deltaX = touch.clientX - startX
        const deltaY = touch.clientY - startY

        if (!axisLocked) {
            if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return
            axisLocked = Math.abs(deltaY) > Math.abs(deltaX) ? 'y' : 'x'
        }
        if (axisLocked === 'x') return

        event.preventDefault()
        offset = Math.min(deltaY, 0)
        applyDrag(offset, false)
    }

    function onTouchEnd() {
        if (!dragging.value) return
        dragging.value = false

        if (axisLocked === 'y' && Math.abs(offset) > threshold) {
            triggerExit()
            return
        }
        reset(true)
    }

    return { onTouchStart, onTouchMove, onTouchEnd, panelEl, triggerExit }
}
