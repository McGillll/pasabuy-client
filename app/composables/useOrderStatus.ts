export const customerOrderStatusColor: Record<string, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error'
}

export const customerOrderStatusLabel: Record<string, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    cancelled: 'cancelled'
}
