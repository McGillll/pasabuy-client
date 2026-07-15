export type CustomerOrderStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid'
export type DeliveryStatus = 'not_delivered' | 'delivered'

export const customerOrderStatusColor: Record<CustomerOrderStatus, 'neutral' | 'success' | 'error' | 'warning'> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error'
}

export const customerOrderStatusLabel: Record<CustomerOrderStatus, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    cancelled: 'cancelled'
}

export const paymentStatusColor: Record<PaymentStatus, 'success' | 'warning' | 'error'> = {
    unpaid: 'error',
    partially_paid: 'warning',
    paid: 'success'
}

export const paymentStatusLabel: Record<PaymentStatus, string> = {
    unpaid: 'Unpaid',
    partially_paid: 'Partially paid',
    paid: 'Paid'
}

export const deliveryStatusColor: Record<DeliveryStatus, 'neutral' | 'success'> = {
    not_delivered: 'neutral',
    delivered: 'success'
}

export const deliveryStatusLabel: Record<DeliveryStatus, string> = {
    not_delivered: 'Not delivered',
    delivered: 'Delivered'
}
