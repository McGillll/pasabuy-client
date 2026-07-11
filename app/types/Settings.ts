export interface Settings {
    business_name: string
    contact_email: string | null
    contact_phone: string | null
    address: string | null
}

export interface SettingsPayload {
    business_name: string
    contact_email?: string | null
    contact_phone?: string | null
    address?: string | null
}
