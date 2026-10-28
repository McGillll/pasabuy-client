export const scheduleStatusColor: Record<string, 'neutral' | 'success' | 'warning'> = {
    open: 'success',
    closed: 'warning',
    finished: 'neutral'
}

export const scheduleStatusLabel: Record<string, string> = {
    open: 'Open',
    closed: 'Closed',
    finished: 'Finished'
}

export const orderStatusColor: Record<string, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error'
}

export function useStatusColors() {
    return { scheduleStatusColor, orderStatusColor }
}
