const activeHandler = ref<(() => Promise<any>) | null>(null)

export function usePullToRefreshHandler() {
    return activeHandler
}

export function onPullToRefresh(handler: () => Promise<any>) {
    if (import.meta.server) return

    activeHandler.value = handler

    onUnmounted(() => {
        if (activeHandler.value === handler) {
            activeHandler.value = null
        }
    })
}
