import BaseAPIService from '@/components/api/BaseAPIService'

export interface ProductPayload {
    name: string
    description?: string
    image?: File | null
    is_active?: boolean
    default_price: number
    category_uuid?: string | null
}

/**
 * Admin product catalog CRUD.
 * GET /api/admin/products, POST /api/admin/products, GET/PUT/DELETE /api/admin/products/{uuid}
 * See api/rsc-doc/product-api.md for response shapes.
 */
class ProductService extends BaseAPIService {
    /**
     * GET /api/admin/products
     * Query params: page, per_page, search, category_uuid.
     * Response: paginated `{ data: Product[], total, ... }`.
     */
    async fetchProducts(params: object = {}): Promise<any> {
        return await this.request('/admin/products', 'GET', params)
    }

    /**
     * GET /api/admin/products/{uuid}
     * Response: single `Product`.
     */
    async fetchProduct(uuid: string): Promise<any> {
        return await this.request(`/admin/products/${uuid}`, 'GET')
    }

    /**
     * POST /api/admin/products
     * FormData fields: name (string, required), description (string, optional),
     * image (File, optional), is_active ('1'|'0', optional), default_price (numeric string, required),
     * category_uuid (string, optional).
     * Response: created `Product`.
     */
    async createProduct(payload: ProductPayload): Promise<any> {
        return await this.request('/admin/products', 'POST', this.buildFormData(payload))
    }

    /**
     * PUT /api/admin/products/{uuid} (sent as POST with `_method: 'PUT'` spoofing)
     * FormData fields: same as createProduct.
     * Response: updated `Product`.
     */
    async updateProduct(uuid: string, payload: ProductPayload): Promise<any> {
        const formData = this.buildFormData(payload)
        formData.append('_method', 'PUT')

        return await this.request(`/admin/products/${uuid}`, 'POST', formData)
    }

    /**
     * DELETE /api/admin/products/{uuid}
     */
    async deleteProduct(uuid: string): Promise<any> {
        return await this.request(`/admin/products/${uuid}`, 'DELETE')
    }

    private buildFormData(payload: ProductPayload): FormData {
        const formData = new FormData()
        formData.append('name', payload.name)
        if (payload.description) formData.append('description', payload.description)
        if (payload.image) formData.append('image', payload.image)
        if (payload.is_active !== undefined) formData.append('is_active', payload.is_active ? '1' : '0')
        formData.append('default_price', String(payload.default_price))
        if (payload.category_uuid) formData.append('category_uuid', payload.category_uuid)

        return formData
    }
}

export const productService = new ProductService()
