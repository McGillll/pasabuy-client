export function useSearchDebounce(source: Ref<string>, callback: () => void, delay = 300) {
    let timeout: ReturnType<typeof setTimeout>

    watch(source, () => {
        clearTimeout(timeout)
        timeout = setTimeout(callback, delay)
    })
}
