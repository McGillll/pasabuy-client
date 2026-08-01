export interface Category {
    uuid: string
    name: string
    description: string | null
    image_url: string | null
    is_active: boolean
    parent_uuid: string | null
    has_children: boolean
}
