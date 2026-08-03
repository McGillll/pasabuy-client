/**
 * Tracks scroll position of a horizontally-scrolling element so callers can
 * show/hide prev/next controls, and exposes a scrollBy helper for them.
 * Does not touch the element's own scroll styling; pair with a scrollbar-hide
 * utility class on the element (native scrollbars read as broken chrome on
 * desktop for a carousel-style row).
 */
export function useHorizontalScroll() {
    const el = ref<HTMLElement | null>(null)
    const canScrollLeft = ref(false)
    const canScrollRight = ref(false)

    function update() {
        const node = el.value
        if (!node) return
        canScrollLeft.value = node.scrollLeft > 4
        canScrollRight.value = node.scrollLeft + node.clientWidth < node.scrollWidth - 4
    }

    function scrollBy(direction: -1 | 1) {
        const node = el.value
        if (!node) return
        node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: 'smooth' })
    }

    onMounted(() => {
        update()
        el.value?.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
    })

    onUnmounted(() => {
        el.value?.removeEventListener('scroll', update)
        window.removeEventListener('resize', update)
    })

    return { el, canScrollLeft, canScrollRight, scrollBy, update }
}
