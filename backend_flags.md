# Backend Flags

Frontend features shipped ahead of an available backend endpoint. Each entry: what's missing, what endpoint/shape is needed, when flagged.

## Schedule closing-soon indicator
- **Flagged:** 2026-07-28
- **Gap:** Dashboard's Recent Schedules list has a `closingSoon`/`note` prop ready to show cutoff-proximity warnings, but the `Schedule` fetch here (`pasabuyScheduleService.fetchSchedulesCacheable`) doesn't return a cutoff date field usable for this.
- **Needed:** The schedule list endpoint needs to expose cutoff-proximity, or the frontend needs to fetch/compute it from `pasabuy_schedule_date`.

## Order pipeline
- **Flagged:** 2026-07-28
- **Gap:** Dashboard's Order Pipeline card needs order counts broken down by status (pending/confirmed/cancelled) in one call; currently this page only fetches pending orders, no cross-status aggregate endpoint exists.
- **Needed:** Either a dashboard-summary endpoint or an aggregate endpoint on the orders resource.

## Top products ranking
- **Flagged:** 2026-07-28
- **Gap:** No per-product order-quantity aggregation endpoint exists yet; `RankedList` component is ready.
- **Needed:** A backend endpoint returning top products by ordered quantity for the seller's schedules.
