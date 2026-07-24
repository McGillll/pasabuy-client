import BaseAPIService from '@/components/api/BaseAPIService'

class PublicProductService extends BaseAPIService {
    async fetchCatalog(params: object = {}): Promise<any> {
        return await this.request('/public/products', 'GET', params)
    }

    async fetchCatalogCacheable(params: object, etag: string | null): Promise<{ data: any[]; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/public/products', params, etag)
        if (result === 'not-modified') return result
        return { data: result.data.data, etag: result.etag }
    }
}

export const publicProductService = new PublicProductService()
