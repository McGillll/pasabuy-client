export function useIsDesktop() {
    const isDesktop = ref(false)

    function update() {
        isDesktop.value = window.matchMedia('(min-width: 640px)').matches
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
