import type { Schedule } from '@/types/Schedule'

const CLOSING_SOON_DAYS = 2
const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

// pasabuy_schedule_date is a plain YYYY-MM-DD in the API's timezone (Asia/Manila), so
// "close by" that date means the end of that day there, not midnight UTC.
function cutoffDeadline(date: string) {
    return new Date(`${date}T23:59:59+08:00`).getTime()
}

export function useScheduleClosingSoon() {
    // Ticks once a minute while the calling component is mounted, so countdowns and
    // "closing soon" flags stay current on a page left open.
    const now = ref(Date.now())
    let timer: ReturnType<typeof setInterval> | null = null

    onMounted(() => {
        now.value = Date.now()
        timer = setInterval(() => { now.value = Date.now() }, MS_PER_MINUTE)
    })
    onUnmounted(() => {
        if (timer) clearInterval(timer)
    })

    function isClosingSoon(schedule: Pick<Schedule, 'status' | 'pasabuy_schedule_date'>) {
        if (schedule.status !== 'open' || !schedule.pasabuy_schedule_date) return false

        const remaining = cutoffDeadline(schedule.pasabuy_schedule_date) - now.value
        return remaining >= 0 && remaining <= CLOSING_SOON_DAYS * MS_PER_DAY
    }

    // Live countdown text for the last CLOSING_SOON_DAYS before the cutoff; null outside that
    // window so callers fall back to the plain date. The seller closes the run manually, so a
    // passed date on a still-open schedule reads as "any time now" rather than "closed".
    function closingCountdown(schedule: Pick<Schedule, 'is_open' | 'pasabuy_schedule_date'>) {
        if (!schedule.is_open || !schedule.pasabuy_schedule_date) return null

        const remaining = cutoffDeadline(schedule.pasabuy_schedule_date) - now.value
        if (remaining > CLOSING_SOON_DAYS * MS_PER_DAY) return null
        if (remaining <= 0) return 'Closing any time now'

        const days = Math.floor(remaining / MS_PER_DAY)
        const hours = Math.floor((remaining % MS_PER_DAY) / MS_PER_HOUR)
        const minutes = Math.max(1, Math.floor((remaining % MS_PER_HOUR) / MS_PER_MINUTE))

        if (days > 0) return `Closes in ${days}d ${hours}h`
        if (hours > 0) return `Closes in ${hours}h ${minutes}m`
        return `Closes in ${minutes}m`
    }

    return { isClosingSoon, closingCountdown }
}
