export function useCachedFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs = 60_000) {
    const data = useState<T | null>(`${key}-data`, () => null)
    const fetchedAt = useState<number>(`${key}-fetched-at`, () => 0)
    const pending = useState<Promise<T> | null>(`${key}-pending`, () => null)

    async function ensure(force = false): Promise<T> {
        const isFresh = !force && data.value !== null && Date.now() - fetchedAt.value < ttlMs
        if (isFresh) return data.value as T

        if (pending.value) return pending.value

        const promise = fetcher()
            .then((result) => {
                data.value = result
                fetchedAt.value = Date.now()
                pending.value = null
                return result
            })
            .catch((error) => {
                pending.value = null
                throw error
            })

        pending.value = promise
        return promise
    }

    function invalidate() {
        fetchedAt.value = 0
    }

    return { data, ensure, invalidate }
}
