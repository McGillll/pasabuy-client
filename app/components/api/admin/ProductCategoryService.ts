import BaseAPIService from '@/components/api/BaseAPIService'

export interface CategoryPayload {
    name: string
    description?: string
    is_active?: boolean
}

/**
 * Admin product category CRUD.
 * See api/rsc-doc/product-category-api.md for response shapes.
 */
class ProductCategoryService extends BaseAPIService {
    /**
     * GET /api/admin/product-categories
     * Query params: page, per_page, search.
     * Response: paginated `{ data: Category[], total, ... }`.
     */
    async fetchCategories(params: object = {}): Promise<any> {
        return await this.request('/admin/product-categories', 'GET', params)
    }

    /**
     * GET /api/admin/product-categories/{uuid}
     * Response: single `Category`.
     */
    async fetchCategory(uuid: string): Promise<any> {
        return await this.request(`/admin/product-categories/${uuid}`, 'GET')
    }

    /**
     * POST /api/admin/product-categories
     * FormData fields: name (string, required), description (string, optional), is_active ('1'|'0', optional).
     * Response: created `Category`.
     */
    async createCategory(payload: CategoryPayload): Promise<any> {
        return await this.request('/admin/product-categories', 'POST', this.buildFormData(payload))
    }

    /**
     * POST /api/admin/product-categories/{uuid}
     * FormData fields: same as createCategory.
     * Response: updated `Category`.
     */
    async updateCategory(uuid: string, payload: CategoryPayload): Promise<any> {
        return await this.request(`/admin/product-categories/${uuid}`, 'POST', this.buildFormData(payload))
    }

    /**
     * DELETE /api/admin/product-categories/{uuid}
     */
    async deleteCategory(uuid: string): Promise<any> {
        return await this.request(`/admin/product-categories/${uuid}`, 'DELETE')
    }

    private buildFormData(payload: CategoryPayload): FormData {
        const formData = new FormData()
        formData.append('name', payload.name)
        if (payload.description) formData.append('description', payload.description)
        if (payload.is_active !== undefined) formData.append('is_active', payload.is_active ? '1' : '0')

        return formData
    }
}

export const productCategoryService = new ProductCategoryService()
