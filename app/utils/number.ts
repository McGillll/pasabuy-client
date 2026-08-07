export function toNumber(value: number | string | null | undefined): number {
    if (typeof value === 'number') return value
    if (value === null || value === undefined || value === '') return 0

    return Number(value.replace(/,/g, ''))
}

export function formatNumber(value: number | string | null | undefined, maximumFractionDigits = 2): string {
    return new Intl.NumberFormat('en-PH', {
        maximumFractionDigits
    }).format(toNumber(value))
}
