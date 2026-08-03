import BaseAPIService from '@/components/api/BaseAPIService'

class PublicProductService extends BaseAPIService {
    async fetchCatalog(params: object = {}): Promise<any> {
        return await this.request('/public/products', 'GET', params)
    }

    async fetchCatalogCacheable(params: object, etag: string | null): Promise<{ data: any[]; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/public/products', params, etag)
        if (result === 'not-modified') return result
        return { data: result.data.items, etag: result.etag }
    }

    async fetchTopSelling(params: object = {}): Promise<any> {
        return await this.request('/public/products/top-selling', 'GET', params)
    }

    async fetchTopSellingCacheable(params: object, etag: string | null): Promise<{ data: any[]; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/public/products/top-selling', params, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }

    async fetchByUuidCacheable(uuid: string, etag: string | null): Promise<{ data: any; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>(`/public/products/${uuid}`, {}, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }
}

export const publicProductService = new PublicProductService()
