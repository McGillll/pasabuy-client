import BaseAPIService from '@/components/api/BaseAPIService'

export interface ProductPayload {
    name: string
    description?: string
    image?: File | null
    is_active?: boolean
}

/**
 * Admin product catalog CRUD.
 * GET /api/admin/products, POST /api/admin/products, GET/PUT/DELETE /api/admin/products/{uuid}
 * See api/rsc-doc/product-api.md for response shapes.
 */
class ProductService extends BaseAPIService {
    async fetchProducts(params: object = {}): Promise<any> {
        return await this.request('/admin/products', 'GET', params)
    }

    async fetchProduct(uuid: string): Promise<any> {
        return await this.request(`/admin/products/${uuid}`, 'GET')
    }

    async createProduct(payload: ProductPayload): Promise<any> {
        return await this.requestFormData('/admin/products', this.buildFormData(payload))
    }

    async updateProduct(uuid: string, payload: ProductPayload): Promise<any> {
        const formData = this.buildFormData(payload)
        formData.append('_method', 'PUT')

        return await this.requestFormData(`/admin/products/${uuid}`, formData)
    }

    async deleteProduct(uuid: string): Promise<any> {
        return await this.request(`/admin/products/${uuid}`, 'DELETE')
    }

    private buildFormData(payload: ProductPayload): FormData {
        const formData = new FormData()
        formData.append('name', payload.name)
        if (payload.description) formData.append('description', payload.description)
        if (payload.image) formData.append('image', payload.image)
        if (payload.is_active !== undefined) formData.append('is_active', payload.is_active ? '1' : '0')

        return formData
    }
}

export const productService = new ProductService()
