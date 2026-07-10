import BaseAPIService from '@/components/api/BaseAPIService'

class PublicProductService extends BaseAPIService {
    async fetchCatalog(params: object = {}): Promise<any> {
        return await this.request('/public/products', 'GET', params)
    }
}

export const publicProductService = new PublicProductService()
