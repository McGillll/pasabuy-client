import { publicProductCategoryService } from '@/components/api/public/PublicProductCategoryService'
import type { Category } from '@/types/Category'

/**
 * Category only carries parent_uuid (one level), so the full trail is built
 * by walking parents one fetch at a time. Ancestors are prepended as each
 * resolves for a progressive reveal rather than one blocking round trip.
 */
export function useCategoryAncestors() {
    const ancestors = ref<Category[]>([])
    const resolving = ref(false)

    async function resolve(category: Category | null) {
        ancestors.value = []
        if (!category) return

        resolving.value = true
        const seen = new Set<string>()
        let current: Category | null = category

        while (current?.parent_uuid && !seen.has(current.parent_uuid)) {
            seen.add(current.parent_uuid)
            try {
                const result = await publicProductCategoryService.fetchByUuidCacheable(current.parent_uuid, null)
                if (result === 'not-modified') break
                const parent = result.data as Category
                ancestors.value = [parent, ...ancestors.value]
                current = parent
            } catch {
                break
            }
        }
        resolving.value = false
    }

    return { ancestors, resolving, resolve }
}
