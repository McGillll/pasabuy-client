export interface ConfirmDialogOptions {
    title: string
    description: string
    color?: 'primary' | 'success' | 'error'
    confirmLabel?: string
    action: () => Promise<void>
}

export function useConfirmDialog() {
    const confirming = ref(false)

    const confirmDialog = reactive({
        open: false,
        title: '',
        description: '',
        color: 'primary' as 'primary' | 'success' | 'error',
        confirmLabel: 'Confirm',
        action: null as (() => Promise<void>) | null
    })

    function askConfirm(options: ConfirmDialogOptions) {
        confirmDialog.title = options.title
        confirmDialog.description = options.description
        confirmDialog.color = options.color ?? 'primary'
        confirmDialog.confirmLabel = options.confirmLabel ?? 'Confirm'
        confirmDialog.action = options.action
        confirmDialog.open = true
    }

    async function confirmDialogAccept() {
        const action = confirmDialog.action
        if (!action) return

        confirming.value = true
        try {
            await action()
        } finally {
            confirming.value = false
        }
        confirmDialog.open = false
    }

    return { confirmDialog, confirming, askConfirm, confirmDialogAccept }
}
