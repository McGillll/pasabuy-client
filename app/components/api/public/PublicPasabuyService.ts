import BaseAPIService from '@/components/api/BaseAPIService'

/**
 * Customer-facing, no-auth endpoint for previewing a pasabuy schedule.
 * Placing an order requires a logged-in customer — see CustomerOrderService.
 * See api/rsc-doc/public-pasabuy-api.md for response shapes.
 */
class PublicPasabuyService extends BaseAPIService {
    /**
     * GET /api/public/pasabuy-schedules/{uuid}
     * Response: `Schedule`. Its `products` array only lists products already ordered —
     * use `publicProductService.fetchCatalog()` for the full orderable catalog.
     */
    async fetchSchedule(uuid: string): Promise<any> {
        return await this.request(`/public/pasabuy-schedules/${uuid}`, 'GET')
    }
}

export const publicPasabuyService = new PublicPasabuyService()
