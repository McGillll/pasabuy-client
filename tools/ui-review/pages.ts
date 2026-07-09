import { FIXTURES } from './fixtures'

export type AuthAs = 'none' | 'seller' | 'customer'

export interface PageEntry {
    name: string
    path: string
    authAs: AuthAs
    waitForSelector?: string
}

export const PAGES: PageEntry[] = [
    { name: 'login', path: '/login', authAs: 'none' },
    { name: 'register', path: '/register', authAs: 'none' },
    { name: 'customer-login', path: '/customer/login', authAs: 'none' },
    { name: 'admin-dashboard', path: '/admin', authAs: 'seller' },
    { name: 'admin-products', path: '/admin/products', authAs: 'seller' },
    { name: 'admin-schedules', path: '/admin/schedules', authAs: 'seller' },
    { name: 'admin-schedule-detail', path: `/admin/schedules/${FIXTURES.openScheduleUuid}`, authAs: 'seller' },
    { name: 'admin-customers', path: '/admin/customers', authAs: 'seller' },
    { name: 'customer-orders', path: '/customer', authAs: 'customer' },
    { name: 'customer-order-detail', path: `/customer/orders/${FIXTURES.customerOrderUuid}`, authAs: 'customer' },
    { name: 'pasabuy-storefront', path: `/pasabuy/${FIXTURES.openScheduleUuid}`, authAs: 'none' },
]
