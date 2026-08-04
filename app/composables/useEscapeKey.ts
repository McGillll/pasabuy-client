export function useEscapeKey(handler: () => void) {
    function onKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape') return
        const target = event.target as HTMLElement | null
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
        handler()
    }

    onMounted(() => window.addEventListener('keydown', onKeydown))
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
