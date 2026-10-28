export type UserRole = 'superadmin' | 'admin' | 'customer'

export interface User {
    uuid: string
    first_name: string
    last_name: string
    email: string
    role: UserRole
    is_approved: boolean
    is_verified: boolean
    receivable: number
    is_valid_to_order: boolean
}

export interface TopBuyer {
    uuid: string
    name: string
    total_spend: string
    order_count: number
}
