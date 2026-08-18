import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date'
import { orderService } from '@/components/api/admin/OrderService'
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import type { ConfirmPricePayload } from '@/components/api/admin/PasabuyScheduleService'
import { productService } from '@/components/api/admin/ProductService'
import { settingsService } from '@/components/api/settings/SettingsService'
import APIError from '@/components/api/user/APIError'
import type { Product } from '@/types/Product'
import type { Schedule, ScheduleProduct, ScheduleSummaryItem, ChecklistItem, ProductBuyer } from '@/types/Schedule'
import type { Order } from '@/types/Order'
import type { OrderItem } from '@/types/OrderItem'
import type { Settings } from '@/types/Settings'

export interface EditableItem {
    product_uuid: string
    product_name: string
    quantity: number
}

export function useScheduleWorkspace(uuid: string) {
    const toast = useToast()
    const { displayName } = useProductDisplayName()
    const { copyTextAsync } = useAsyncClipboard()
    const { confirmDialog, confirming, askConfirm, confirmDialogAccept } = useConfirmDialog()
    const { runUndoable } = useUndoableAction()
    const { setOrderStatusUndoable } = useOrderUndoAction()
    const { $echo } = useNuxtApp()

    // ---- Core schedule ----

    const schedule = ref<Schedule | null>(null)
    const loading = ref(true)
    const scheduleEtag = ref<string | null>(null)
    const changingStatus = ref(false)

    const isClosed = computed(() => schedule.value?.status === 'closed')
    const isFinished = computed(() => schedule.value?.status === 'finished')
    const isLocked = computed(() => isClosed.value || isFinished.value)

    const detailsForm = reactive({
        title: '',
        description: '',
        pasabuyScheduleDate: ''
    })
    const savingDetails = ref(false)

    const publicLink = computed(() => {
        if (!import.meta.client) return ''
        return `${window.location.origin}/pasabuy/${uuid}`
    })

    function canSetStatus(target: string) {
        const current = schedule.value?.status
        if (current === target) return true
        if (changingStatus.value) return false
        if (current === 'open') return target === 'closed'
        if (current === 'closed') return target === 'open' || target === 'finished'
        return false
    }

    function getScheduleProductStatus(productUuid: string | null) {
        return schedule.value?.products.find((sp) => sp.product?.uuid === productUuid)?.product_status
    }

    function getScheduleProductPrice(productUuid: string | null) {
        const sp = schedule.value?.products.find((p) => p.product?.uuid === productUuid)
        if (sp) {
            return sp.actual_price !== null && sp.actual_price !== undefined ? toNumber(sp.actual_price) : toNumber(sp.product?.default_price ?? 0)
        }
        const product = allProducts.value.find((p) => p.uuid === productUuid)
        return toNumber(product?.default_price ?? 0)
    }

    async function saveDetails() {
        if (!detailsForm.pasabuyScheduleDate) {
            toast.add({ title: 'Pasabuy date is required', color: 'error' })
            return
        }

        savingDetails.value = true
        try {
            const response = await pasabuyScheduleService.updateSchedule(uuid, {
                title: detailsForm.title,
                description: detailsForm.description,
                pasabuy_schedule_date: detailsForm.pasabuyScheduleDate
            })
            schedule.value = { ...schedule.value!, ...response.data }
            toast.add({ title: 'Schedule updated', color: 'success' })
        } catch (error) {
            toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
        } finally {
            savingDetails.value = false
        }
    }

    function closeSchedule() {
        askConfirm({
            title: 'Close schedule?',
            description: 'Customers will no longer be able to order or edit their orders. You can reopen it later if needed.',
            confirmLabel: 'Close schedule',
            action: async () => {
                changingStatus.value = true
                try {
                    const response = await pasabuyScheduleService.closeSchedule(uuid)
                    schedule.value = { ...schedule.value!, ...response.data }
                    toast.add({ title: 'Schedule closed', color: 'success' })
                    await loadChecklist()
                } catch (error) {
                    toast.add({ title: 'Failed to close schedule', description: (error as APIError).message, color: 'error' })
                } finally {
                    changingStatus.value = false
                }
            }
        })
    }

    function reopenSchedule() {
        askConfirm({
            title: 'Reopen schedule?',
            description: 'Customers will be able to order and edit their orders again.',
            confirmLabel: 'Reopen schedule',
            action: async () => {
                changingStatus.value = true
                try {
                    const response = await pasabuyScheduleService.reopenSchedule(uuid)
                    schedule.value = { ...schedule.value!, ...response.data }
                    toast.add({ title: 'Schedule reopened', color: 'success' })
                } catch (error) {
                    toast.add({ title: 'Failed to reopen schedule', description: (error as APIError).message, color: 'error' })
                } finally {
                    changingStatus.value = false
                }
            }
        })
    }

    const isFinishModalOpen = ref(false)
    const finishDueDate = ref<CalendarDate | null>(null)
    const finishingSchedule = ref(false)

    function finishSchedule() {
        finishDueDate.value = today(getLocalTimeZone())
        isFinishModalOpen.value = true
    }

    async function confirmFinishSchedule() {
        if (!finishDueDate.value) {
            toast.add({ title: 'Select a due date', color: 'error' })
            return
        }

        finishingSchedule.value = true
        changingStatus.value = true
        try {
            const response = await pasabuyScheduleService.finishSchedule(uuid, { due_date: finishDueDate.value.toString() })
            schedule.value = { ...schedule.value!, ...response.data }
            toast.add({ title: 'Schedule finished', color: 'success' })
            isFinishModalOpen.value = false
        } catch (error) {
            toast.add({ title: 'Failed to finish schedule', description: (error as APIError).message, color: 'error' })
        } finally {
            finishingSchedule.value = false
            changingStatus.value = false
        }
    }

    function handleStatusTabChange(value: string | number) {
        if (value === schedule.value?.status) return
        if (value === 'closed') closeSchedule()
        else if (value === 'open') reopenSchedule()
        else if (value === 'finished') finishSchedule()
    }

    async function copyLink() {
        await copyTextAsync(async () => publicLink.value)
        toast.add({ title: 'Link copied', color: 'success' })
    }

    const isPosterModalOpen = ref(false)
    const posterBusinessName = ref('Pasabuy')
    const posterSettingsLoaded = ref(false)

    async function loadPosterBusinessName() {
        if (posterSettingsLoaded.value) return

        try {
            const response = await settingsService.fetchPublicSettings()
            const settings = response.data as Settings
            posterBusinessName.value = settings.business_name?.trim() || 'Pasabuy'
        } catch {
            posterBusinessName.value = 'Pasabuy'
        } finally {
            posterSettingsLoaded.value = true
        }
    }

    function openPosterModal() {
        isPosterModalOpen.value = true
        loadPosterBusinessName()
    }

    // ---- Summary / pricing ----

    const summary = ref<ScheduleSummaryItem[]>([])
    const canConfirmPrice = computed(() => schedule.value?.status !== 'finished')

    const summaryGrandTotal = computed(() => summary.value.reduce((sum, item) => sum + toNumber(item.subtotal), 0))

    function getDisplayQuantity(item: ScheduleSummaryItem) {
        return getScheduleProductStatus(item.product_uuid) === 'b1t1' ? item.total_quantity * 2 : item.total_quantity
    }

    const pricingSearch = ref('')
    const pricingCategoryFilter = ref('all')

    const pricingCategoryOptions = computed(() => {
        const seen = new Map<string, string>()
        for (const item of summary.value) {
            const name = item.category_name ?? 'Uncategorized'
            seen.set(name, name)
        }
        return [{ label: 'All', value: 'all' }, ...[...seen.values()].sort().map((name) => ({ label: name, value: name }))]
    })

    const filteredSummary = computed(() => {
        const query = pricingSearch.value.trim().toLowerCase()
        return summary.value.filter((item) => {
            if (query && !item.product_name.toLowerCase().includes(query)) return false
            if (pricingCategoryFilter.value !== 'all' && (item.category_name ?? 'Uncategorized') !== pricingCategoryFilter.value) return false
            return true
        })
    })

    async function refreshSummary() {
        const response = await pasabuyScheduleService.fetchScheduleSummary(uuid)
        summary.value = response.data
    }

    // ---- Buyers modal / price confirmation ----

    const isBuyersModalOpen = ref(false)
    const buyersLoading = ref(false)
    const buyers = ref<ProductBuyer[]>([])
    const selectedSummaryItem = ref<ScheduleSummaryItem | null>(null)
    const selectedScheduleProduct = computed(() =>
        schedule.value?.products.find((sp) => sp.product?.uuid === selectedSummaryItem.value?.product_uuid) ?? null
    )

    const confirmForm = reactive({
        actual_price: null as number | null,
        product_status: 'none' as 'none' | 'b1t1' | 'out_of_stock',
        saving: false
    })

    async function openBuyersModal(item: ScheduleSummaryItem) {
        selectedSummaryItem.value = item
        isBuyersModalOpen.value = true

        if (!item.product_uuid) {
            buyers.value = []
            return
        }

        const scheduleProduct = schedule.value?.products.find((sp) => sp.product?.uuid === item.product_uuid)
        confirmForm.actual_price = scheduleProduct?.actual_price !== null && scheduleProduct?.actual_price !== undefined
            ? toNumber(scheduleProduct.actual_price)
            : toNumber(scheduleProduct?.product?.default_price ?? 0)
        confirmForm.product_status = scheduleProduct?.product_status ?? 'none'

        buyersLoading.value = true
        try {
            const response = await pasabuyScheduleService.fetchProductBuyers(uuid, item.product_uuid)
            buyers.value = response.data
        } catch (error) {
            toast.add({
                title: 'Failed to load buyers',
                description: (error as APIError).message,
                color: 'error',
                actions: [{ label: 'Retry', onClick: () => openBuyersModal(item) }]
            })
        } finally {
            buyersLoading.value = false
        }
    }

    async function applyPriceConfirmation(scheduleProduct: ScheduleProduct, payload: ConfirmPricePayload) {
        const response = await pasabuyScheduleService.confirmProductPrice(uuid, scheduleProduct.uuid, payload)

        const updated = response.data.schedule_product as ScheduleProduct
        const sp = schedule.value?.products.find((p) => p.uuid === scheduleProduct.uuid)
        if (sp) Object.assign(sp, updated)

        await Promise.all([refreshOrders(), refreshSummary()])
        syncViewingOrder()

        return response.data.summary as { auto_applied: number, bonus_applied: number, out_of_stock: number }
    }

    async function confirmSelectedPrice() {
        const scheduleProduct = selectedScheduleProduct.value
        if (!scheduleProduct) return

        confirmForm.saving = true
        try {
            const priceSummary = await applyPriceConfirmation(scheduleProduct, {
                actual_price: confirmForm.product_status === 'out_of_stock' ? undefined : (confirmForm.actual_price ?? undefined),
                product_status: confirmForm.product_status
            })

            const parts = [`${priceSummary.auto_applied} auto-updated`]
            if (priceSummary.bonus_applied > 0) parts.push(`${priceSummary.bonus_applied} got a B1T1 bonus`)
            if (priceSummary.out_of_stock > 0) parts.push(`${priceSummary.out_of_stock} out of stock`)

            toast.add({ title: 'Price confirmed', description: parts.join(', '), color: 'success' })
        } catch (error) {
            toast.add({ title: 'Confirm failed', description: (error as APIError).message, color: 'error' })
        } finally {
            confirmForm.saving = false
        }
    }

    // ---- Shopping checklist ----

    const checklistItems = ref<ChecklistItem[]>([])
    const checklistLoading = ref(false)
    const regeneratingChecklist = ref(false)
    const togglingUuid = ref<string | null>(null)
    const loadingChecklistShareLink = ref(false)
    const regeneratingChecklistShareLink = ref(false)
    const checklistCategoryFilter = ref('all')

    const checklistCategoryOptions = computed(() => {
        const seen = new Map<string, string>()
        for (const item of checklistItems.value) {
            const name = item.category_name ?? 'Uncategorized'
            seen.set(name, name)
        }
        return [{ label: 'All', value: 'all' }, ...[...seen.values()].sort().map((name) => ({ label: name, value: name }))]
    })

    const filteredChecklistItems = computed(() => {
        return checklistItems.value.filter((item) => {
            if (checklistCategoryFilter.value !== 'all' && (item.category_name ?? 'Uncategorized') !== checklistCategoryFilter.value) return false
            return true
        })
    })

    const checklistCheckedCount = computed(() => checklistItems.value.filter((item) => item.is_checked).length)
    const checklistTotalCount = computed(() => checklistItems.value.length)

    async function loadChecklist() {
        checklistLoading.value = true
        try {
            const response = await pasabuyScheduleService.fetchChecklist(uuid)
            checklistItems.value = response.data
        } catch (error) {
            toast.add({
                title: 'Failed to load checklist',
                description: (error as APIError).message,
                color: 'error',
                actions: [{ label: 'Retry', onClick: () => loadChecklist() }]
            })
        } finally {
            checklistLoading.value = false
        }
    }

    async function regenerateChecklist(silent = false) {
        if (!silent) regeneratingChecklist.value = true
        try {
            const response = await pasabuyScheduleService.regenerateChecklist(uuid)
            checklistItems.value = response.data
            if (!silent) toast.add({ title: 'Checklist regenerated', color: 'success' })
        } catch (error) {
            if (!silent) toast.add({ title: 'Failed to regenerate checklist', description: (error as APIError).message, color: 'error' })
        } finally {
            if (!silent) regeneratingChecklist.value = false
        }
    }

    async function toggleChecklist(item: ChecklistItem, isChecked: boolean) {
        if (!item.product_uuid) return

        const previousIsChecked = item.is_checked
        const previousCheckedAt = item.checked_at

        item.is_checked = isChecked
        togglingUuid.value = item.product_uuid
        try {
            const response = await pasabuyScheduleService.toggleChecklistItem(uuid, item.product_uuid, isChecked)
            Object.assign(item, response.data)
        } catch (error) {
            item.is_checked = previousIsChecked
            item.checked_at = previousCheckedAt
            toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
        } finally {
            togglingUuid.value = null
        }
    }

    const confirmingChecklistUuid = ref<string | null>(null)

    // Fuses "confirm in-store price/stock" with "check off" — checking an item opens a
    // confirm sheet (instead of toggling immediately) so the seller confirms price/stock
    // at the exact moment they're looking at the shelf, rather than as a separate pass later.
    async function confirmChecklistItemPrice(item: ChecklistItem, payload: ConfirmPricePayload) {
        if (!item.product_uuid) return false

        const scheduleProduct = schedule.value?.products.find((sp) => sp.product?.uuid === item.product_uuid)
        if (!scheduleProduct) return false

        confirmingChecklistUuid.value = item.product_uuid
        try {
            await applyPriceConfirmation(scheduleProduct, payload)
            await toggleChecklist(item, true)
            toast.add({ title: 'Checked off', description: 'Price and stock confirmed.', color: 'success' })
            return true
        } catch (error) {
            toast.add({ title: 'Confirm failed', description: (error as APIError).message, color: 'error' })
            return false
        } finally {
            confirmingChecklistUuid.value = null
        }
    }

    const checklistShareToken = ref<string | null>(null)
    let checklistChannel: ReturnType<typeof $echo.channel> | null = null

    function applyBroadcastChecklistUpdate(updatedItem: ChecklistItem) {
        const item = checklistItems.value.find((candidate) => candidate.product_uuid === updatedItem.product_uuid)
        if (item) Object.assign(item, updatedItem)
    }

    function applyBroadcastChecklistRegenerated(payload: { items: ChecklistItem[] }) {
        checklistItems.value = payload.items
    }

    function subscribeChecklistChannel(token: string) {
        if (checklistShareToken.value) $echo.leaveChannel(`checklist.${checklistShareToken.value}`)
        checklistShareToken.value = token
        checklistChannel = $echo.channel(`checklist.${token}`)
        checklistChannel.listen('.checklist.item.toggled', applyBroadcastChecklistUpdate)
        checklistChannel.listen('.checklist.regenerated', applyBroadcastChecklistRegenerated)
    }

    function stopChecklistLiveSync() {
        if (checklistShareToken.value) $echo.leaveChannel(`checklist.${checklistShareToken.value}`)
        checklistChannel = null
        checklistShareToken.value = null
    }

    async function startChecklistLiveSync() {
        if (checklistChannel) return
        try {
            const response = await pasabuyScheduleService.fetchChecklistShareLink(uuid)
            subscribeChecklistChannel(response.data.token)
        } catch {
            // Share link isn't ready yet (schedule not closed); admin can still toggle items manually.
        }
    }

    async function copyChecklistShareLink() {
        loadingChecklistShareLink.value = true
        try {
            let token = ''
            await copyTextAsync(async () => {
                const response = await pasabuyScheduleService.fetchChecklistShareLink(uuid)
                token = response.data.token
                return `${window.location.origin}/pasabuy/checklist/${token}`
            })
            toast.add({ title: 'Helper link copied', description: 'Anyone with this link can view and check off items, no account needed.', color: 'success' })
        } catch (error) {
            toast.add({ title: 'Failed to get share link', description: (error as APIError).message, color: 'error' })
        } finally {
            loadingChecklistShareLink.value = false
        }
    }

    function regenerateChecklistShareLinkAction() {
        askConfirm({
            title: 'Regenerate helper link?',
            description: 'This invalidates the current helper link. Anyone still using it will lose access.',
            confirmLabel: 'Regenerate link',
            color: 'error',
            action: async () => {
                regeneratingChecklistShareLink.value = true
                try {
                    let token = ''
                    await copyTextAsync(async () => {
                        const response = await pasabuyScheduleService.regenerateChecklistShareLink(uuid)
                        token = response.data.token
                        return `${window.location.origin}/pasabuy/checklist/${token}`
                    })
                    toast.add({ title: 'New helper link copied', description: 'The previous link no longer works.', color: 'success' })
                    if (checklistChannel) subscribeChecklistChannel(token)
                } catch (error) {
                    toast.add({ title: 'Failed to revoke link', description: (error as APIError).message, color: 'error' })
                } finally {
                    regeneratingChecklistShareLink.value = false
                }
            }
        })
    }

    // ---- Orders list ----

    const orders = ref<Order[]>([])
    const orderSearch = ref('')
    const orderStatusFilter = ref('all')
    const orderPaymentStatusFilter = ref('all')
    const orderDeliveryStatusFilter = ref('all')

    const pendingOrderCount = computed(() => orders.value.filter((o) => o.status === 'pending').length)

    // ---- Bulk order selection ----

    const selectedOrderUuids = ref<Set<string>>(new Set())

    const selectedOrders = computed(() => orders.value.filter((order) => selectedOrderUuids.value.has(order.uuid)))
    const selectedOrderCount = computed(() => selectedOrderUuids.value.size)

    function isOrderSelected(order: Order) {
        return selectedOrderUuids.value.has(order.uuid)
    }

    function removeOrderFromSelection(orderUuid: string) {
        if (!selectedOrderUuids.value.has(orderUuid)) return
        const next = new Set(selectedOrderUuids.value)
        next.delete(orderUuid)
        selectedOrderUuids.value = next
    }

    function toggleOrderSelection(order: Order) {
        if (order.status !== 'pending') return
        const next = new Set(selectedOrderUuids.value)
        if (next.has(order.uuid)) next.delete(order.uuid)
        else next.add(order.uuid)
        selectedOrderUuids.value = next
    }

    function setOrdersSelected(targetOrders: Order[], selected: boolean) {
        const next = new Set(selectedOrderUuids.value)
        for (const order of targetOrders) {
            if (order.status !== 'pending') continue
            if (selected) next.add(order.uuid)
            else next.delete(order.uuid)
        }
        selectedOrderUuids.value = next
    }

    function clearOrderSelection() {
        selectedOrderUuids.value = new Set()
    }

    // Re-validates the selection whenever the order list is reloaded from the server
    // (not on the in-place status flips the undo pattern makes), so a stale selection
    // can't survive an order being removed or settled by someone else in the meantime.
    watch(orders, () => {
        const stillSelectable = new Set(
            orders.value.filter((order) => order.status === 'pending').map((order) => order.uuid)
        )
        const pruned = new Set([...selectedOrderUuids.value].filter((uuid) => stillSelectable.has(uuid)))
        if (pruned.size !== selectedOrderUuids.value.size) selectedOrderUuids.value = pruned
    })

    // Loops the existing single-order status endpoint since there is no bulk endpoint yet.
    // Uses the delayed-commit undo pattern: the change applies to the UI immediately and only
    // reaches the API after the undo window closes, so a bulk mistake never needs a confirm modal.
    function bulkSetOrderStatus(status: 'confirmed' | 'cancelled') {
        const targets = selectedOrders.value
        if (targets.length === 0) return

        const previousStatuses = new Map(targets.map((order) => [order.uuid, order.status] as const))
        const verb = status === 'confirmed' ? 'confirmed' : 'cancelled'
        clearOrderSelection()

        runUndoable({
            label: `${targets.length} order${targets.length === 1 ? '' : 's'} ${verb}`,
            apply: () => { targets.forEach((order) => { order.status = status }) },
            revert: () => { targets.forEach((order) => { order.status = previousStatuses.get(order.uuid)! }) },
            commit: async () => {
                const failedUuids: string[] = []
                await Promise.all(targets.map(async (order) => {
                    try {
                        await pasabuyScheduleService.updateOrderStatus(order.uuid, status)
                    } catch {
                        failedUuids.push(order.uuid)
                        order.status = previousStatuses.get(order.uuid)!
                    }
                }))
                if (failedUuids.length > 0) {
                    const succeeded = targets.length - failedUuids.length
                    selectedOrderUuids.value = new Set(failedUuids)
                    toast.add({
                        title: `${succeeded} ${verb}, ${failedUuids.length} failed`,
                        description: 'The failed orders stay selected so you can try again.',
                        color: succeeded > 0 ? 'warning' : 'error',
                        actions: [{ label: 'Retry failed', onClick: () => { bulkSetOrderStatus(status) } }]
                    })
                }
            }
        })
    }

    function bulkConfirmOrders() {
        bulkSetOrderStatus('confirmed')
    }

    function bulkCancelOrders() {
        bulkSetOrderStatus('cancelled')
    }

    const orderActiveFilterCount = computed(() =>
        [orderStatusFilter.value, orderPaymentStatusFilter.value, orderDeliveryStatusFilter.value].filter((value) => value !== 'all').length
    )

    function clearOrderFilters() {
        orderStatusFilter.value = 'all'
        orderPaymentStatusFilter.value = 'all'
        orderDeliveryStatusFilter.value = 'all'
    }

    const filteredOrders = computed(() => {
        const query = orderSearch.value.trim().toLowerCase()
        return orders.value.filter((order) => {
            if (query) {
                const haystack = `${order.customer_name} ${order.customer_contact} ${order.order_no}`.toLowerCase()
                if (!haystack.includes(query)) return false
            }
            if (orderStatusFilter.value === 'all') {
                if (order.status === 'cancelled') return false
            } else if (order.status !== orderStatusFilter.value) {
                return false
            }
            if (orderPaymentStatusFilter.value !== 'all' && order.payment_status !== orderPaymentStatusFilter.value) return false
            if (orderDeliveryStatusFilter.value !== 'all' && order.delivery_status !== orderDeliveryStatusFilter.value) return false
            return true
        })
    })

    function orderDisplayAmount(order: Order) {
        return isFinished.value ? order.amount_due : order.total_amount
    }

    async function refreshOrders() {
        const response = await pasabuyScheduleService.fetchOrders(uuid)
        orders.value = response.data
    }

    function confirmOrder(order: Order) {
        askConfirm({
            title: 'Confirm order?',
            description: `Confirm ${order.customer_name}'s order? Let them know it's locked in.`,
            confirmLabel: 'Confirm order',
            color: 'success',
            action: () => setOrderStatusUndoable(order, 'confirmed', { onApply: () => removeOrderFromSelection(order.uuid) })
        })
    }

    function cancelOrder(order: Order) {
        askConfirm({
            title: 'Cancel order?',
            description: `Cancel ${order.customer_name}'s order? They will need to place a new one if they change their mind.`,
            confirmLabel: 'Cancel order',
            color: 'error',
            action: () => setOrderStatusUndoable(order, 'cancelled', { onApply: () => removeOrderFromSelection(order.uuid) })
        })
    }

    async function setDeliveryStatus(order: Order, deliveryStatus: 'not_delivered' | 'delivered') {
        try {
            const response = await orderService.updateDeliveryStatus(order.uuid, deliveryStatus)
            order.delivery_status = response.data.delivery_status
            toast.add({ title: `Order marked as ${deliveryStatusLabel[deliveryStatus].toLowerCase()}`, color: 'success' })
        } catch (error) {
            toast.add({ title: 'Update failed', description: (error as APIError).message, color: 'error' })
        }
    }

    function toggleDeliveryStatus(order: Order) {
        const nextStatus = order.delivery_status === 'not_delivered' ? 'delivered' : 'not_delivered'
        askConfirm({
            title: nextStatus === 'delivered' ? 'Mark as delivered?' : 'Mark as not delivered?',
            description: `Mark ${order.customer_name}'s order as ${deliveryStatusLabel[nextStatus]!.toLowerCase()}?`,
            confirmLabel: nextStatus === 'delivered' ? 'Mark delivered' : 'Mark not delivered',
            color: nextStatus === 'delivered' ? 'success' : 'primary',
            action: () => setDeliveryStatus(order, nextStatus)
        })
    }

    // ---- Order detail modal / item editing ----

    const isOrderModalOpen = ref(false)
    const viewingOrder = ref<Order | null>(null)
    const canEditOrderItems = computed(() => isClosed.value)
    const editingProductUuid = ref<string | null>(null)

    const editableItems = ref<EditableItem[]>([])
    const originalEditableItems = ref<EditableItem[]>([])
    const itemToAdd = ref<string | undefined>(undefined)
    const savingOrderItems = ref(false)

    const hasUnsavedOrderItemChanges = computed(() =>
        JSON.stringify(editableItems.value) !== JSON.stringify(originalEditableItems.value)
    )

    function buildEditableItems(order: Order): EditableItem[] {
        return order.items
            .filter((item) => item.product_uuid)
            .map((item) => ({ product_uuid: item.product_uuid!, product_name: item.product_name, quantity: item.quantity }))
    }

    // Existing order items still shown via viewingOrder.items; ones removed from editableItems drop out here.
    const displayItems = computed(() => {
        const items = viewingOrder.value?.items ?? []
        if (!canEditOrderItems.value) return items
        const editableUuids = new Set(editableItems.value.map((item) => item.product_uuid))
        return items.filter((item) => !item.product_uuid || editableUuids.has(item.product_uuid))
    })

    // Items added via "Add a product" that aren't part of the saved order yet, shown as pending rows until saved.
    const pendingNewItems = computed(() => {
        if (!canEditOrderItems.value) return []
        const existingUuids = new Set((viewingOrder.value?.items ?? []).map((item) => item.product_uuid))
        return editableItems.value.filter((item) => !existingUuids.has(item.product_uuid))
    })

    function findEditableItem(productUuid?: string) {
        return editableItems.value.find((item) => item.product_uuid === productUuid)
    }

    // Live preview of the order total while editing, since viewingOrder.total_amount only updates after Save.
    const draftOrderTotal = computed(() => {
        if (!canEditOrderItems.value) return null
        return editableItems.value.reduce((sum, item) => {
            if (getScheduleProductStatus(item.product_uuid) === 'out_of_stock') return sum
            return sum + getScheduleProductPrice(item.product_uuid) * item.quantity
        }, 0)
    })

    // Per-line quantity/subtotal preview while editing; displayItems still holds the server-saved values.
    function getLineQuantity(item: OrderItem) {
        if (!canEditOrderItems.value || !item.product_uuid) return item.quantity
        return findEditableItem(item.product_uuid)?.quantity ?? item.quantity
    }

    function getLineSubtotal(item: OrderItem) {
        if (!canEditOrderItems.value || !item.product_uuid) return toNumber(item.subtotal)
        if (getScheduleProductStatus(item.product_uuid) === 'out_of_stock') return 0
        return getScheduleProductPrice(item.product_uuid) * getLineQuantity(item)
    }

    const allProducts = ref<Product[]>([])
    const loadingAllProducts = ref(false)

    async function loadAllProducts() {
        if (allProducts.value.length > 0 || loadingAllProducts.value) return
        loadingAllProducts.value = true
        try {
            const response = await productService.fetchProducts({ per_page: 1000 })
            allProducts.value = response.data.items
        } catch (error) {
            toast.add({
                title: 'Failed to load products',
                description: (error as APIError).message,
                color: 'error',
                actions: [{ label: 'Retry', onClick: () => loadAllProducts() }]
            })
        } finally {
            loadingAllProducts.value = false
        }
    }

    const addableProductOptions = computed(() => {
        const usedUuids = new Set(editableItems.value.map((item) => item.product_uuid))
        return allProducts.value
            .filter((product) => product.is_active && !usedUuids.has(product.uuid))
            .map((product) => ({ label: displayName(product), value: product.uuid }))
    })

    function syncViewingOrder() {
        if (!viewingOrder.value) return
        const updated = orders.value.find((o) => o.uuid === viewingOrder.value!.uuid)
        if (!updated) return

        viewingOrder.value = updated
        editableItems.value = buildEditableItems(updated)
        originalEditableItems.value = buildEditableItems(updated)
    }

    function viewOrder(order: Order) {
        viewingOrder.value = order
        editableItems.value = buildEditableItems(order)
        originalEditableItems.value = buildEditableItems(order)
        itemToAdd.value = undefined
        editingProductUuid.value = null
        isOrderModalOpen.value = true
        if (canEditOrderItems.value) loadAllProducts()
    }

    function removeEditableItem(productUuid: string) {
        editableItems.value = editableItems.value.filter((item) => item.product_uuid !== productUuid)
    }

    function addEditableItem() {
        if (!itemToAdd.value) return
        const product = allProducts.value.find((p) => p.uuid === itemToAdd.value)
        if (!product) return

        editableItems.value.push({ product_uuid: product.uuid, product_name: displayName(product), quantity: 1 })
        itemToAdd.value = undefined
    }

    function revertOrderItems() {
        editableItems.value = originalEditableItems.value.map((item) => ({ ...item }))
        editingProductUuid.value = null
        itemToAdd.value = undefined
    }

    async function saveOrderItems() {
        if (!viewingOrder.value) return

        savingOrderItems.value = true
        try {
            const response = await pasabuyScheduleService.updateOrderItems(
                uuid,
                viewingOrder.value.uuid,
                editableItems.value.map((item) => ({ product_uuid: item.product_uuid, quantity: item.quantity }))
            )
            viewingOrder.value = response.data
            const row = orders.value.find((o) => o.uuid === response.data.uuid)
            if (row) Object.assign(row, response.data)
            editableItems.value = buildEditableItems(response.data)
            originalEditableItems.value = buildEditableItems(response.data)
            editingProductUuid.value = null
            await refreshSummary()
            toast.add({ title: 'Order items updated', color: 'success' })
        } catch (error) {
            toast.add({ title: 'Failed to update order items', description: (error as APIError).message, color: 'error' })
        } finally {
            savingOrderItems.value = false
        }
    }

    function orderActions(order: Order) {
        if (order.status !== 'pending') return []
        return [
            ...(isClosed.value ? [{ label: 'Confirm order', icon: 'i-lucide-check', color: 'success' as const, onSelect: () => confirmOrder(order) }] : []),
            { label: 'Cancel order', icon: 'i-lucide-x', color: 'error' as const, onSelect: () => cancelOrder(order) }
        ]
    }

    // ---- Load / refresh orchestration ----

    async function loadAll() {
        loading.value = true
        try {
            const [scheduleResponse, ordersResponse, summaryResponse] = await Promise.all([
                pasabuyScheduleService.fetchScheduleCacheable(uuid, scheduleEtag.value),
                pasabuyScheduleService.fetchOrders(uuid),
                pasabuyScheduleService.fetchScheduleSummary(uuid)
            ])

            if (scheduleResponse !== 'not-modified') {
                schedule.value = scheduleResponse.data
                scheduleEtag.value = scheduleResponse.etag
            }
            orders.value = ordersResponse.data
            summary.value = summaryResponse.data

            detailsForm.title = schedule.value!.title
            detailsForm.description = schedule.value!.description ?? ''
            detailsForm.pasabuyScheduleDate = schedule.value!.pasabuy_schedule_date ?? ''

            await loadChecklist()
        } catch (error) {
            toast.add({
                title: 'Failed to load schedule',
                description: (error as APIError).message,
                color: 'error',
                actions: [{ label: 'Retry', onClick: () => loadAll() }]
            })
        } finally {
            loading.value = false
        }
    }

    async function pullRefresh() {
        try {
            const [scheduleResponse, ordersResponse, summaryResponse] = await Promise.all([
                pasabuyScheduleService.fetchScheduleCacheable(uuid, scheduleEtag.value),
                pasabuyScheduleService.fetchOrders(uuid),
                pasabuyScheduleService.fetchScheduleSummary(uuid)
            ])
            if (scheduleResponse !== 'not-modified') {
                schedule.value = scheduleResponse.data
                scheduleEtag.value = scheduleResponse.etag
            }
            orders.value = ordersResponse.data
            summary.value = summaryResponse.data
            await loadChecklist()
        } catch (error) {
            toast.add({
                title: 'Failed to refresh',
                description: (error as APIError).message,
                color: 'error',
                actions: [{ label: 'Retry', onClick: () => pullRefresh() }]
            })
        }
    }

    // Wrapped in `reactive()` (not returned as a plain object of refs) so that passing this
    // whole bundle down as a single `:workspace` prop still lets children read/write through it
    // directly (`workspace.checklistCategoryFilter = 'all'`, `v-model="workspace.orderSearch"`)
    // without unwrapping — a plain object would silently replace the underlying ref on write.
    return reactive({
        uuid,
        schedule,
        loading,
        isClosed,
        isFinished,
        isLocked,
        detailsForm,
        savingDetails,
        publicLink,
        isPosterModalOpen,
        posterBusinessName,
        canSetStatus,
        getScheduleProductStatus,
        getScheduleProductPrice,
        saveDetails,
        closeSchedule,
        reopenSchedule,
        finishSchedule,
        isFinishModalOpen,
        finishDueDate,
        finishingSchedule,
        confirmFinishSchedule,
        handleStatusTabChange,
        copyLink,
        openPosterModal,

        summary,
        canConfirmPrice,
        summaryGrandTotal,
        getDisplayQuantity,
        refreshSummary,
        pricingSearch,
        pricingCategoryFilter,
        pricingCategoryOptions,
        filteredSummary,

        isBuyersModalOpen,
        buyersLoading,
        buyers,
        selectedSummaryItem,
        selectedScheduleProduct,
        confirmForm,
        openBuyersModal,
        confirmSelectedPrice,

        checklistItems,
        checklistLoading,
        regeneratingChecklist,
        togglingUuid,
        confirmingChecklistUuid,
        confirmChecklistItemPrice,
        loadingChecklistShareLink,
        regeneratingChecklistShareLink,
        checklistCategoryFilter,
        checklistCategoryOptions,
        checklistCheckedCount,
        checklistTotalCount,
        filteredChecklistItems,
        loadChecklist,
        regenerateChecklist,
        toggleChecklist,
        startChecklistLiveSync,
        stopChecklistLiveSync,
        copyChecklistShareLink,
        regenerateChecklistShareLinkAction,

        orders,
        orderSearch,
        orderStatusFilter,
        orderPaymentStatusFilter,
        orderDeliveryStatusFilter,
        pendingOrderCount,
        orderActiveFilterCount,
        clearOrderFilters,
        filteredOrders,
        orderDisplayAmount,
        refreshOrders,
        confirmOrder,
        cancelOrder,
        setDeliveryStatus,
        toggleDeliveryStatus,
        orderActions,

        selectedOrderCount,
        isOrderSelected,
        toggleOrderSelection,
        setOrdersSelected,
        clearOrderSelection,
        bulkConfirmOrders,
        bulkCancelOrders,

        isOrderModalOpen,
        viewingOrder,
        canEditOrderItems,
        editingProductUuid,
        editableItems,
        itemToAdd,
        savingOrderItems,
        hasUnsavedOrderItemChanges,
        displayItems,
        pendingNewItems,
        findEditableItem,
        draftOrderTotal,
        getLineQuantity,
        getLineSubtotal,
        allProducts,
        loadingAllProducts,
        addableProductOptions,
        viewOrder,
        removeEditableItem,
        addEditableItem,
        revertOrderItems,
        saveOrderItems,

        loadAll,
        pullRefresh,

        confirmDialog,
        confirming,
        confirmDialogAccept
    })
}

export type ScheduleWorkspace = ReturnType<typeof useScheduleWorkspace>
