export function useIsDesktop(breakpointPx: number = 640) {
    const isDesktop = ref(false)

    function update() {
        isDesktop.value = window.matchMedia(`(min-width: ${breakpointPx}px)`).matches
    }

    onMounted(() => {
        update()
        window.addEventListener('resize', update)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', update)
    })

    return isDesktop
}
