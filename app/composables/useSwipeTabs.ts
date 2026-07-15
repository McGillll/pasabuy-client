export function useSwipeTabs<T extends string>(activeTab: Ref<T>, tabValues: Ref<T[]> | ComputedRef<T[]>) {
    const threshold = 50
    const offset = ref(0)
    const dragging = ref(false)
    const suppressTransition = ref(false)
    const animating = ref(false)

    let startX = 0
    let startY = 0
    let axisLocked: 'x' | 'y' | null = null

    function currentIndex() {
        return tabValues.value.indexOf(activeTab.value)
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
        offset.value = atStart || atEnd ? deltaX / 3 : deltaX
    }

    function onTouchEnd() {
        if (!dragging.value) return
        dragging.value = false

        const delta = offset.value
        const index = currentIndex()

        if (axisLocked === 'x' && Math.abs(delta) > threshold) {
            const next = delta < 0 ? index + 1 : index - 1
            if (next >= 0 && next < tabValues.value.length) {
                const exitDistance = Math.max(window.innerWidth, 320)
                animating.value = true
                offset.value = delta < 0 ? -exitDistance : exitDistance

                window.setTimeout(() => {
                    suppressTransition.value = true
                    activeTab.value = tabValues.value[next]!
                    offset.value = delta < 0 ? exitDistance : -exitDistance

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            suppressTransition.value = false
                            offset.value = 0
                            window.setTimeout(() => { animating.value = false }, 240)
                        })
                    })
                }, 220)
                return
            }
        }

        offset.value = 0
    }

    const panelStyle = computed(() => ({
        transform: `translateX(${offset.value}px)`,
        transition: dragging.value || suppressTransition.value ? 'none' : 'transform 220ms ease'
    }))

    return { onTouchStart, onTouchMove, onTouchEnd, panelStyle }
}
