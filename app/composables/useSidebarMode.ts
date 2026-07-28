const STORAGE_KEY = 'admin_sidebar_mode'

export type SidebarMode = 'labeled' | 'rail'

export function useSidebarMode() {
    const mode = useState<SidebarMode>('admin_sidebar_mode', () => 'labeled')

    function init() {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === 'labeled' || stored === 'rail') {
            mode.value = stored
        }
    }

    function toggle() {
        mode.value = mode.value === 'labeled' ? 'rail' : 'labeled'
        localStorage.setItem(STORAGE_KEY, mode.value)
    }

    return { mode, init, toggle }
}
