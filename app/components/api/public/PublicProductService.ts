import BaseAPIService from '@/components/api/BaseAPIService'

/**
 * Customer-facing, no-auth product catalog — the full active catalog, which is
 * what customers order from on any pasabuy schedule (see api/rsc-doc/product-api.md).
 */
class PublicProductService extends BaseAPIService {
    /**
     * GET /api/public/products
     * Query params: page, per_page, search.
     * Response: paginated `{ data: Product[], total, ... }` — every item is_active.
     */
    async fetchCatalog(params: object = {}): Promise<any> {
        return await this.request('/public/products', 'GET', params)
    }
}

export const publicProductService = new PublicProductService()
