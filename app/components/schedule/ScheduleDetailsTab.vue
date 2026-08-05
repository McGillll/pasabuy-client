<template>
    <div class="mt-4 max-w-lg space-y-4">
        <div class="flex items-center gap-3 rounded-xl bg-elevated px-3 py-2.5 ring-1 ring-default">
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UIcon name="i-lucide-link" class="size-4" />
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-xs font-medium uppercase tracking-wide text-dimmed">Share link</p>
                <p class="truncate text-sm font-medium text-highlighted">{{ workspace.schedule!.title }}</p>
            </div>
            <BaseButton icon="i-lucide-copy" color="primary" variant="soft" size="sm" @click="workspace.copyLink">Copy</BaseButton>
        </div>

        <UCard>
            <p class="mb-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-dimmed">
                Status
                <BaseHelpTooltip>
                    Closing stops new orders and unlocks the shopping checklist and order-item editing. Finishing locks in the confirmed prices and invoice due date and cannot be undone.
                </BaseHelpTooltip>
            </p>
            <ScheduleStatusStepper
                :status="workspace.schedule!.status"
                :can-set-status="workspace.canSetStatus"
                @change="workspace.handleStatusTabChange"
            />
            <p class="mt-3 text-sm text-muted">{{ statusNote }}</p>
        </UCard>

        <UCard>
            <p class="mb-3 text-xs font-medium uppercase tracking-wide text-dimmed">Schedule info</p>

            <template v-if="!workspace.isLocked">
                <form class="space-y-4" @submit.prevent="workspace.saveDetails">
                    <BaseFormField label="Title" required>
                        <BaseInput v-model="workspace.detailsForm.title" placeholder="July grocery run" />
                    </BaseFormField>
                    <BaseFormField label="Description">
                        <BaseTextarea v-model="workspace.detailsForm.description" placeholder="Optional notes for this pasabuy" />
                    </BaseFormField>
                    <BaseFormField label="Pasabuy date" hint="The date you'll go to the store; ordering closes once this date arrives" required>
                        <BaseDatePicker v-model="workspace.detailsForm.pasabuyScheduleDate" min="today" />
                    </BaseFormField>
                    <BaseButton type="submit" :loading="workspace.savingDetails">
                        Save details
                    </BaseButton>
                </form>
            </template>

            <template v-else>
                <div class="divide-y divide-default">
                    <div class="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span class="font-medium text-muted">Title</span>
                        <span class="truncate text-right font-medium text-highlighted">{{ workspace.schedule!.title }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span class="font-medium text-muted">Description</span>
                        <span class="truncate text-right font-medium text-highlighted">{{ workspace.schedule!.description || '-' }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span class="font-medium text-muted">Pasabuy date</span>
                        <span class="text-right font-medium text-highlighted">{{ workspace.schedule!.pasabuy_schedule_date ? formatDate(workspace.schedule!.pasabuy_schedule_date) : '-' }}</span>
                    </div>
                    <div v-if="workspace.isFinished" class="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span class="font-medium text-muted">Invoice due date</span>
                        <span class="text-right font-medium text-highlighted">{{ workspace.schedule!.due_date ? formatDate(workspace.schedule!.due_date) : '-' }}</span>
                    </div>
                </div>

                <button
                    type="button"
                    class="mt-1 flex w-full items-center justify-center gap-1.5 border-t border-default pt-3 text-sm font-medium text-primary"
                    @click="isFormExpanded = !isFormExpanded"
                >
                    <UIcon :name="isFormExpanded ? 'i-lucide-chevron-up' : 'i-lucide-lock'" class="size-4" />
                    {{ isFormExpanded ? 'Hide form' : (workspace.isClosed ? 'Locked while closed' : 'Locked, finished') }}
                </button>

                <form v-if="isFormExpanded" class="mt-4 space-y-4 border-t border-default pt-4" @submit.prevent="workspace.saveDetails">
                    <BaseFormField label="Title" required>
                        <BaseInput v-model="workspace.detailsForm.title" disabled />
                    </BaseFormField>
                    <BaseFormField label="Description">
                        <BaseTextarea v-model="workspace.detailsForm.description" disabled />
                    </BaseFormField>
                    <BaseFormField label="Pasabuy date" hint="The date you'll go to the store; ordering closes once this date arrives" required>
                        <BaseDatePicker v-model="workspace.detailsForm.pasabuyScheduleDate" min="today" disabled />
                    </BaseFormField>
                    <BaseButton type="submit" disabled>
                        Save details
                    </BaseButton>
                </form>
            </template>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'

const props = defineProps<{
    workspace: ScheduleWorkspace
}>()

const isFormExpanded = ref(false)

const statusNote = computed(() => {
    if (props.workspace.isFinished) return 'This batch is fully settled. Details can no longer be edited.'
    if (props.workspace.isClosed) return 'Reopen to edit the title, description, or pasabuy date below.'
    return 'Close the schedule once ordering ends, then mark it finished once fully settled.'
})
</script>
