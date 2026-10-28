import type { ChecklistItem } from '@/types/Schedule'

// Applies a fresh server copy of the checklist without swapping out item objects that are
// still on screen: matching items are updated in place (so an open confirm sheet keeps its
// reference), new items are added, and items the server no longer has are dropped.
export function mergeChecklistItems(current: ChecklistItem[], fresh: ChecklistItem[]): ChecklistItem[] {
    const key = (item: ChecklistItem) => item.product_uuid ?? `name:${item.product_name}`
    const existing = new Map(current.map((item) => [key(item), item]))

    return fresh.map((item) => {
        const match = existing.get(key(item))
        return match ? Object.assign(match, item) : item
    })
}
