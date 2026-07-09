export interface OrderItemGroup<T> {
    item: T
    bonus: T | null
}

export function groupOrderItems<T extends { uuid: string; product_uuid?: string; is_bonus: boolean }>(items: T[]): OrderItemGroup<T>[] {
    const bonusByProduct = new Map<string, T>()
    for (const item of items) {
        if (item.is_bonus && item.product_uuid) bonusByProduct.set(item.product_uuid, item)
    }

    const groups: OrderItemGroup<T>[] = []
    for (const item of items) {
        if (item.is_bonus) continue
        groups.push({ item, bonus: (item.product_uuid && bonusByProduct.get(item.product_uuid)) || null })
    }

    const paired = new Set(groups.map((g) => g.bonus).filter(Boolean))
    for (const item of items) {
        if (item.is_bonus && !paired.has(item)) groups.push({ item, bonus: null })
    }

    return groups
}
