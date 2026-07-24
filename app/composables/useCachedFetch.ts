type CachedFetchResult<T> = { data: T; etag: string | null } | 'not-modified'

export function useCachedFetch<T>(key: string, fetcher: (etag: string | null) => Promise<CachedFetchResult<T>>, ttlMs = 60_000) {
    const data = useState<T | null>(`${key}-data`, () => null)
    const etag = useState<string | null>(`${key}-etag`, () => null)
    const fetchedAt = useState<number>(`${key}-fetched-at`, () => 0)
    const pending = useState<Promise<T> | null>(`${key}-pending`, () => null)

    async function ensure(force = false): Promise<T> {
        const isFresh = !force && data.value !== null && Date.now() - fetchedAt.value < ttlMs
        if (isFresh) return data.value as T

        if (pending.value) return pending.value

        const promise = fetcher(etag.value)
            .then((result) => {
                if (result !== 'not-modified') {
                    data.value = result.data
                    etag.value = result.etag
                }
                fetchedAt.value = Date.now()
                pending.value = null
                return data.value as T
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
