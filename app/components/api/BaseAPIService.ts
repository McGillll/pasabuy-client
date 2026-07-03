import APIError from '@/components/api/user/APIError'

class BaseAPIService {
    async request(url: string, method: string, params: object = [], signal?: AbortSignal): Promise<any> {
        const runtimeConfig = useRuntimeConfig()
        let config: any = null
        if (method === 'GET') {
            // GET
            config = {
                baseURL: runtimeConfig.public.apiBaseURL,
                method: method,
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('_token'),
                    Accept: 'application/json',
                },
                signal,
                async onRequest({ request, options }: { request: any, options: any }) {
                    options.params = params
                },
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
            return await $fetch<any>(url, config)
        } catch (error: any) {
            if (error?.name === 'AbortError') throw error
            switch (error.response?.status) {
                case 400:
                    throw new APIError(error.response._data)
                case 404:
                case 422:
                    throw new APIError(error.response._data)
                case 429:
                    throw new APIError(error.response._data)
                case 401:
                    this.revokeAccess()
                case 500:
                    throw new APIError({
                        message: "Server error. Please try again. If the problem persists, contact your system administrator"
                    })
                default:
                    throw new APIError({
                        message: "Something went wrong. Please try again. If the problem persists, contact your system administrator"
                    })
            }
        }
    }



    revokeAccess() {
        localStorage.removeItem("_token")
        localStorage.removeItem("rememberMe")
        navigateTo('/')
    }
}

export default BaseAPIService