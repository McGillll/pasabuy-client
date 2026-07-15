export function formatDate(value: string): string {
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value) ? value.replace(' ', 'T') : value
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
