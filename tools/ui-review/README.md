# UI review tooling (internal, not part of build/CI)

Lightweight Playwright setup used only to screenshot the app during a manual UI/UX
consistency review. Not wired into `package.json` scripts or CI.

Prereqs: API running on `http://127.0.0.1:8000` with `admin@pasabuy.test` / `password`
seller and the customer/schedule fixtures in `fixtures.ts` present in the DB.

Run from `client/`:

```
# one-time: capture auth storage states
pnpm exec playwright test --config=tools/ui-review/playwright.config.ts -g setup

# full baseline capture (all pages, both viewports)
pnpm exec playwright test --config=tools/ui-review/playwright.config.ts -g capture

# scoped capture (e.g. only admin pages), tag the round so before/after stays separate
UI_REVIEW_ROUND=round-1 pnpm exec playwright test --config=tools/ui-review/playwright.config.ts -g "admin"
```

Screenshots land in `screenshots/<round>/<mobile|desktop>/<page-name>.png`.
