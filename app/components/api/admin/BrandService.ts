import BaseAPIService from '@/components/api/BaseAPIService'

export interface BrandPayload {
    name: string
    logo_url?: string | null
    is_active?: boolean
}

class BrandService extends BaseAPIService {
    async fetchBrands(params: object = {}): Promise<any> {
        return await this.request('/admin/brands', 'GET', params)
    }

    async fetchBrandsCacheable(params: object, etag: string | null): Promise<{ data: any[]; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/admin/brands', params, etag)
        if (result === 'not-modified') return result
        return { data: result.data.items, etag: result.etag }
    }

    async fetchBrand(uuid: string): Promise<any> {
        return await this.request(`/admin/brands/${uuid}`, 'GET')
    }

    async createBrand(payload: BrandPayload): Promise<any> {
        return await this.request('/admin/brands', 'POST', payload)
    }

    async updateBrand(uuid: string, payload: BrandPayload): Promise<any> {
        return await this.request(`/admin/brands/${uuid}`, 'PUT', payload)
    }

    async deleteBrand(uuid: string): Promise<any> {
        return await this.request(`/admin/brands/${uuid}`, 'DELETE')
    }
}

export const brandService = new BrandService()
