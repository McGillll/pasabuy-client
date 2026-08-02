import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'

interface OrderLike {
    uuid: string
    customer_name: string
    status: 'pending' | 'confirmed' | 'cancelled'
}

export function useOrderUndoAction() {
    const { runUndoable } = useUndoableAction()
    const toast = useToast()

    function setOrderStatusUndoable<T extends OrderLike>(order: T, status: 'confirmed' | 'cancelled', hooks?: {
        onApply?: () => void
        onRevert?: () => void
    }) {
        const previousStatus = order.status
        const verb = status === 'confirmed' ? 'confirmed' : 'cancelled'

        runUndoable({
            label: `${order.customer_name}'s order ${verb}`,
            apply: () => {
                order.status = status
                hooks?.onApply?.()
            },
            revert: () => {
                order.status = previousStatus
                hooks?.onRevert?.()
            },
            commit: () => pasabuyScheduleService.updateOrderStatus(order.uuid, status),
            onError: (error) => toast.add({
                title: status === 'confirmed' ? 'Confirm failed' : 'Cancel failed',
                description: (error as APIError).message,
                color: 'error'
            })
        })
    }

    return { setOrderStatusUndoable }
}
