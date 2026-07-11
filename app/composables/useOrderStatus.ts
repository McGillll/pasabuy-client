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

export const paymentStatusColor: Record<string, 'success' | 'warning' | 'error'> = {
    unpaid: 'error',
    partially_paid: 'warning',
    paid: 'success'
}

export const paymentStatusLabel: Record<string, string> = {
    unpaid: 'Unpaid',
    partially_paid: 'Partially paid',
    paid: 'Paid'
}

export const deliveryStatusColor: Record<string, 'neutral' | 'success'> = {
    not_delivered: 'neutral',
    delivered: 'success'
}

export const deliveryStatusLabel: Record<string, string> = {
    not_delivered: 'Not delivered',
    delivered: 'Delivered'
}
