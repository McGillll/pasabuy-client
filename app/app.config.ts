export default defineAppConfig({
    ui: {
        colors: {
            primary: 'primary',
            secondary: 'secondary',
            neutral: 'stone'
        },
        // 44px controls to match inputs/buttons. Nine 44px buttons overflow a 375px
        // screen, so first/last jump buttons only appear from sm up.
        pagination: {
            slots: {
                first: 'min-h-11 min-w-11 justify-center max-sm:hidden',
                prev: 'min-h-11 min-w-11 justify-center',
                item: 'min-h-11 min-w-11 justify-center',
                next: 'min-h-11 min-w-11 justify-center',
                last: 'min-h-11 min-w-11 justify-center max-sm:hidden'
            }
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
