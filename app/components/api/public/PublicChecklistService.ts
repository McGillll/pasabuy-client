import BaseAPIService from '@/components/api/BaseAPIService'

/**
 * No-auth checklist access for a seller's shopping helper.
 * Keyed by a share token (not the schedule uuid) — see api/rsc-doc/pasabuy-schedule-api.md,
 * "Public checklist (unauthenticated)" section, for response shapes and error conditions.
 */
class PublicChecklistService extends BaseAPIService {
    /**
     * GET /api/public/checklist/{token}
     * Response: `ChecklistItem[]`. 404 if the token is invalid/rotated, 422 if the
     * schedule isn't closed/finished yet.
     */
    async fetchChecklist(token: string): Promise<any> {
        return await this.request(`/public/checklist/${token}`, 'GET')
    }

    /**
     * PATCH /api/public/checklist/{token}/{productUuid} (sent as POST with `_method: 'PATCH'` spoofing)
     * FormData fields: is_checked ('1'|'0', required).
     * Response: updated `ChecklistItem`.
     */
    async toggleChecklistItem(token: string, productUuid: string, isChecked: boolean): Promise<any> {
        const formData = new FormData()
        formData.append('_method', 'PATCH')
        formData.append('is_checked', isChecked ? '1' : '0')

        return await this.request(`/public/checklist/${token}/${productUuid}`, 'POST', formData)
    }
}

export const publicChecklistService = new PublicChecklistService()
