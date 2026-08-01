<template>
    <BaseModal
        v-model:open="workspace.isFinishModalOpen"
        title="Finish schedule?"
        size="sm"
        show-default-footer
        confirm-label="Mark finished"
        confirm-color="success"
        :loading="workspace.finishingSchedule"
        :confirm-disabled="!workspace.finishDueDate"
        @confirm="workspace.confirmFinishSchedule"
    >
        <div class="space-y-3">
            <p class="text-sm text-muted">
                Pick the invoice due date for every order on this schedule. This cannot be undone or changed afterward.
            </p>
            <div class="flex justify-center">
                <UCalendar v-model="workspace.finishDueDate" :min-value="todayDate" />
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date'
import type { ScheduleWorkspace } from '@/composables/useScheduleWorkspace'

defineProps<{
    workspace: ScheduleWorkspace
}>()

const todayDate = today(getLocalTimeZone())
</script>
