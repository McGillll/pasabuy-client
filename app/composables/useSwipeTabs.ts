/**
 * Applies the drag transform directly to the panel DOM node instead of through
 * a reactive style binding, so a touchmove tick only mutates one element's
 * inline style (compositor-only) instead of triggering a Vue re-render/vdom
 * diff of the whole panel (which can hold a long product/order list) on every event.
 */
export function useSwipeTabs<T extends string>(activeTab: Ref<T>, tabValues: Ref<T[]> | ComputedRef<T[]>) {
    const threshold = 50
    const dragging = ref(false)
    const animating = ref(false)
    const panelEl = ref<HTMLElement | null>(null)

    let startX = 0
    let startY = 0
    let axisLocked: 'x' | 'y' | null = null
    let offset = 0

    function currentIndex() {
        return tabValues.value.indexOf(activeTab.value)
    }

    function applyTransform(value: number, withTransition: boolean) {
        offset = value
        const el = panelEl.value
        if (!el) return
        el.style.transition = withTransition ? 'transform 220ms ease' : 'none'
        el.style.transform = `translateX(${value}px)`
    }

    function onTouchStart(event: TouchEvent) {
        if (event.touches.length !== 1 || animating.value) return
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
            axisLocked = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'
        }
        if (axisLocked === 'y') return

        event.preventDefault()

        const index = currentIndex()
        const atStart = index <= 0 && deltaX > 0
        const atEnd = index >= tabValues.value.length - 1 && deltaX < 0
        applyTransform(atStart || atEnd ? deltaX / 3 : deltaX, false)
    }

    function onTouchEnd() {
        if (!dragging.value) return
        dragging.value = false

        const delta = offset
        const index = currentIndex()

        if (axisLocked === 'x' && Math.abs(delta) > threshold) {
            const next = delta < 0 ? index + 1 : index - 1
            if (next >= 0 && next < tabValues.value.length) {
                const exitDistance = Math.max(window.innerWidth, 320)
                animating.value = true
                applyTransform(delta < 0 ? -exitDistance : exitDistance, true)

                window.setTimeout(() => {
                    activeTab.value = tabValues.value[next]!

                    nextTick(() => {
                        applyTransform(delta < 0 ? exitDistance : -exitDistance, false)

                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                applyTransform(0, true)
                                window.setTimeout(() => { animating.value = false }, 240)
                            })
                        })
                    })
                }, 220)
                return
            }
        }

        applyTransform(0, true)
    }

    return { onTouchStart, onTouchMove, onTouchEnd, panelEl }
}
