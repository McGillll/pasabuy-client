export const scheduleStatusColor: Record<string, 'neutral' | 'success' | 'warning'> = {
    open: 'success',
    closed: 'warning',
    finished: 'neutral'
}

export const orderStatusColor: Record<string, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending: 'neutral',
    confirmed: 'success',
    cancelled: 'error'
}

export function useStatusColors() {
    return { scheduleStatusColor, orderStatusColor }
}
