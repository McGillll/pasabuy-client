export default defineAppConfig({
    ui: {
        colors: {
            primary: 'primary',
            secondary: 'secondary',
            neutral: 'slate'
        },
        dropdownMenu: {
            slots: {
                content: 'min-w-40'
            },
            variants: {
                size: {
                    md: {
                        item: 'py-2.5 sm:py-1.5 text-sm gap-1.5'
                    }
                }
            }
        }
    }
})
