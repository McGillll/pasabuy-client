import APIError from '@/components/api/user/APIError'

class BaseAPIService {
    async request(url: string, method: string, params: object = [], signal?: AbortSignal): Promise<any> {
        const runtimeConfig = useRuntimeConfig()
        let config: any = null
        let requestUrl = url

        if (method === 'GET') {
            // GET: build the query string directly into the URL so it's guaranteed to be sent
            const query = new URLSearchParams()
            Object.entries(params ?? {}).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    query.append(key, String(value))
                }
            })
            const queryString = query.toString()
            requestUrl = queryString ? `${url}?${queryString}` : url

            config = {
                baseURL: runtimeConfig.public.apiBaseURL,
                method: method,
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('_token'),
                    Accept: 'application/json',
                },
                signal,
            }
        } else {
            // POST, PUT, DELETE
            config = {
                baseURL: runtimeConfig.public.apiBaseURL,
                method: method,
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('_token'),
                    Accept: 'application/json',
                },
                signal,
                body: params,
            }
        }

        try {
            return await $fetch<any>(requestUrl, config)
        } catch (error: any) {
            if (error?.name === 'AbortError') throw error
            if (error.response?.status === 401 && localStorage.getItem('_token')) {
                this.revokeAccess()
            }
            const responseMessage = error.response?._data?.message
            throw new APIError({
                message: responseMessage ?? "Something went wrong. Please try again. If the problem persists, contact your system administrator",
                errors: error.response?._data?.errors,
            })
        }
    }



    async requestCacheable<T>(url: string, params: object, etag: string | null, signal?: AbortSignal): Promise<{ data: T; etag: string | null } | 'not-modified'> {
        const runtimeConfig = useRuntimeConfig()

        const query = new URLSearchParams()
        Object.entries(params ?? {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query.append(key, String(value))
            }
        })
        const queryString = query.toString()
        const requestUrl = queryString ? `${url}?${queryString}` : url

        const headers: Record<string, string> = {
            Authorization: 'Bearer ' + localStorage.getItem('_token'),
            Accept: 'application/json',
        }
        if (etag) headers['If-None-Match'] = etag

        try {
            const response = await $fetch.raw<any>(requestUrl, {
                baseURL: runtimeConfig.public.apiBaseURL,
                method: 'GET',
                headers,
                signal,
            })
            if (response.status === 304) return 'not-modified'
            return { data: (response._data as any)?.data as T, etag: response.headers.get('etag') }
        } catch (error: any) {
            if (error?.name === 'AbortError') throw error
            if (error.response?.status === 304) return 'not-modified'
            if (error.response?.status === 401 && localStorage.getItem('_token')) {
                this.revokeAccess()
            }
            const responseMessage = error.response?._data?.message
            throw new APIError({
                message: responseMessage ?? "Something went wrong. Please try again. If the problem persists, contact your system administrator",
                errors: error.response?._data?.errors,
            })
        }
    }

    revokeAccess() {
        localStorage.removeItem("_token")
        localStorage.removeItem("rememberMe")
        navigateTo('/')
    }
}

export default BaseAPIService