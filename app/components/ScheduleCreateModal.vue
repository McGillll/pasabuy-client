<template>
    <BaseModal
        v-model:open="open"
        title="New Pasabuy Schedule"
        show-default-footer
        form-id="schedule-create-form"
        confirm-label="Create"
        :loading="saving"
    >
        <form id="schedule-create-form" class="space-y-4" @submit.prevent="onCreate">
            <BaseFormField label="Title" required>
                <BaseInput v-model="form.title" placeholder="July grocery run" />
            </BaseFormField>
            <BaseFormField label="Description">
                <BaseTextarea v-model="form.description" placeholder="Optional notes for this pasabuy" />
            </BaseFormField>
            <BaseFormField label="Pasabuy date" hint="The date you'll go to the store" required>
                <BaseInput v-model="form.pasabuy_schedule_date" type="date" required />
            </BaseFormField>
        </form>
    </BaseModal>
</template>

<script setup lang="ts">
import { pasabuyScheduleService } from '@/components/api/admin/PasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { Schedule } from '@/types/Schedule'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
    created: [schedule: Schedule]
}>()

const toast = useToast()
const saving = ref(false)
const form = reactive({ title: '', description: '', pasabuy_schedule_date: '' })

watch(open, (value) => {
    if (value) {
        form.title = ''
        form.description = ''
        form.pasabuy_schedule_date = ''
    }
})

async function onCreate() {
    if (!form.pasabuy_schedule_date) {
        toast.add({ title: 'Pasabuy date is required', color: 'error' })
        return
    }

    saving.value = true
    try {
        const response = await pasabuyScheduleService.createSchedule({
            title: form.title,
            description: form.description,
            pasabuy_schedule_date: form.pasabuy_schedule_date
        })
        open.value = false
        emit('created', response.data)
    } catch (error) {
        toast.add({ title: 'Create failed', description: (error as APIError).message, color: 'error' })
    } finally {
        saving.value = false
    }
}
</script>
