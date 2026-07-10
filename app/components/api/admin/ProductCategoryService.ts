import BaseAPIService from '@/components/api/BaseAPIService'

export interface CategoryPayload {
    name: string
    description?: string
    is_active?: boolean
}

class ProductCategoryService extends BaseAPIService {
    async fetchCategories(params: object = {}): Promise<any> {
        return await this.request('/admin/product-categories', 'GET', params)
    }

    async fetchCategory(uuid: string): Promise<any> {
        return await this.request(`/admin/product-categories/${uuid}`, 'GET')
    }

    async createCategory(payload: CategoryPayload): Promise<any> {
        return await this.request('/admin/product-categories', 'POST', payload)
    }

    async updateCategory(uuid: string, payload: CategoryPayload): Promise<any> {
        return await this.request(`/admin/product-categories/${uuid}`, 'PUT', payload)
    }

    async deleteCategory(uuid: string): Promise<any> {
        return await this.request(`/admin/product-categories/${uuid}`, 'DELETE')
    }
}

export const productCategoryService = new ProductCategoryService()
