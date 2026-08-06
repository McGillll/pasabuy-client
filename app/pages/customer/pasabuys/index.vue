<template>
    <div class="space-y-6">
        <div class="hidden items-center gap-2 md:flex">
            <IconPasabuys class="size-5 text-primary" />
            <h1 class="text-xl font-semibold text-highlighted">Pasabuy</h1>
        </div>

        <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <UCard v-for="n in skeletonCount" :key="n" :ui="{ body: 'space-y-3' }">
                <USkeleton class="h-5 w-2/3" />
                <USkeleton class="h-4 w-full" />
                <USkeleton class="h-4 w-1/2" />
            </UCard>
        </div>

        <UAlert
            v-else-if="error"
            color="error"
            variant="subtle"
            title="Failed to load pasabuys"
            :description="error"
        >
            <template #actions>
                <BaseButton size="xs" color="error" variant="soft" @click="loadSchedules">
                    Retry
                </BaseButton>
            </template>
        </UAlert>

        <div v-else-if="schedules.length === 0" class="flex flex-col items-center gap-3 py-10 text-center">
            <IconPasabuys class="size-8 text-dimmed" />
            <p class="text-sm text-muted">No pasabuys are open right now. Check back soon.</p>
            <BaseButton size="sm" color="neutral" variant="soft" to="/customer/aisles">
                Browse products in the meantime
            </BaseButton>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScheduleBrowseCard v-for="schedule in schedules" :key="schedule.uuid" :schedule="schedule" />
        </div>

        <div v-if="total > perPage" class="flex justify-center">
            <UPagination v-model:page="page" :total="total" :items-per-page="perPage" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { customerPasabuyScheduleService } from '@/components/api/customer/CustomerPasabuyScheduleService'
import APIError from '@/components/api/user/APIError'
import type { ScheduleBrowseItem } from '@/types/Schedule'

definePageMeta({ layout: 'customer', middleware: 'customer-auth' })

useHead({ title: 'Open Pasabuys' })

const schedules = ref<ScheduleBrowseItem[]>([])
const loading = ref(true)
const error = ref('')
const page = ref(1)
const perPage = 15
const total = ref(0)
const skeletonCount = 6

async function loadSchedules() {
    loading.value = true
    error.value = ''
    try {
        const response = await customerPasabuyScheduleService.fetchOpenSchedules({
            page: page.value,
            per_page: perPage
        })
        schedules.value = response.data.items
        total.value = response.data.total
    } catch (err) {
        error.value = (err as APIError).message
    } finally {
        loading.value = false
    }
}

watch(page, loadSchedules)

onMounted(loadSchedules)
onPullToRefresh(loadSchedules)
</script>
