import type { Schedule } from '@/types/Schedule'

const CLOSING_SOON_DAYS = 2

export function useScheduleClosingSoon() {
    function isClosingSoon(schedule: Pick<Schedule, 'status' | 'pasabuy_schedule_date'>) {
        if (schedule.status !== 'open' || !schedule.pasabuy_schedule_date) return false

        const cutoff = new Date(schedule.pasabuy_schedule_date)
        const daysLeft = (cutoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        return daysLeft >= 0 && daysLeft <= CLOSING_SOON_DAYS
    }

    return { isClosingSoon }
}
