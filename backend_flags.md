# Backend Flags

Frontend features shipped ahead of an available backend endpoint. Each entry: what's missing, what endpoint/shape is needed, when flagged.

## Schedule closing-soon indicator
- **Flagged:** 2026-07-28
- ✅ **RESOLVED 2026-07-30:** No backend gap. `PasabuyScheduleResource` already returns `pasabuy_schedule_date` and `is_open` on the list endpoint. The gap was frontend-only: `fetchSchedulesCacheable` was typed as `any[]` and `admin/index.vue` had a narrower local `Schedule` interface that dropped the date field. Fixed by typing the service response as `ScheduleBrowseItem` (`app/types/Schedule.ts`, which already had the field) and computing `closingSoon`/`note` client-side in `admin/index.vue` from `pasabuy_schedule_date` (flags "Closes tomorrow"/"Closes today" when the cutoff is within 1 day and the schedule is still open).

## Nice to haves

- **Order pipeline aggregate:** Resolved 2026-07-29 via 2 extra `GET /api/admin/orders?status=X&per_page=1` calls (reusing the pending-orders total already fetched for the attention queue) to read `.data.total` per status. If seller order volume grows large, a dedicated single-call aggregate endpoint (counts per status in one query) would be a worthwhile perf optimization later.
