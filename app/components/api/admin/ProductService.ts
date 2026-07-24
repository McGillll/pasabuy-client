import BaseAPIService from '@/components/api/BaseAPIService'

export interface ProductPayload {
    name: string
    description?: string
    image?: File | null
    is_active?: boolean
    default_price: number
    default_product_status?: 'none' | 'b1t1' | 'out_of_stock'
    category_uuid?: string | null
}

class ProductService extends BaseAPIService {
    async fetchProducts(params: object = {}): Promise<any> {
        return await this.request('/admin/products', 'GET', params)
    }

    async fetchProductsCacheable(params: object, etag: string | null): Promise<{ data: any; etag: string | null } | 'not-modified'> {
        const result = await this.requestCacheable<any>('/admin/products', params, etag)
        if (result === 'not-modified') return result
        return { data: result.data, etag: result.etag }
    }

    async fetchProduct(uuid: string): Promise<any> {
        return await this.request(`/admin/products/${uuid}`, 'GET')
    }

    async createProduct(payload: ProductPayload): Promise<any> {
        return await this.request('/admin/products', 'POST', this.buildFormData(payload))
    }

    async updateProduct(uuid: string, payload: ProductPayload): Promise<any> {
        return await this.request(`/admin/products/${uuid}`, 'POST', this.buildFormData(payload))
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
        formData.append('default_price', String(payload.default_price))
        if (payload.default_product_status) formData.append('default_product_status', payload.default_product_status)
        if (payload.category_uuid) formData.append('category_uuid', payload.category_uuid)

        return formData
    }
}

export const productService = new ProductService()
