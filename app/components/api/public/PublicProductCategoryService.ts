import BaseAPIService from '@/components/api/BaseAPIService'

class PublicProductCategoryService extends BaseAPIService {
    async fetchChildrenCacheable(params: object, etag: string | null): Promise<{ data: any[]; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/public/product-categories', params, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }

    async fetchByUuidCacheable(uuid: string, etag: string | null): Promise<{ data: any; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>(`/public/product-categories/${uuid}`, {}, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }
}

export const publicProductCategoryService = new PublicProductCategoryService()
