import { test } from '@playwright/test'
import { PAGES, type AuthAs } from '../pages'

const ROUND = process.env.UI_REVIEW_ROUND ?? 'baseline'

const STORAGE_STATE: Record<AuthAs, string | undefined> = {
    none: undefined,
    seller: 'tools/ui-review/auth/seller.json',
    customer: 'tools/ui-review/auth/customer.json',
}

for (const entry of PAGES) {
    test.describe(entry.name, () => {
        test.use({ storageState: STORAGE_STATE[entry.authAs] })

        test(entry.name, async ({ page }, testInfo) => {
            await page.goto(entry.path, { waitUntil: 'load' })
            await page.waitForTimeout(8000)
            if (entry.waitForSelector) {
                await page.waitForSelector(entry.waitForSelector)
            }
            await page.screenshot({
                path: `tools/ui-review/screenshots/${ROUND}/${testInfo.project.name}/${entry.name}.png`,
                fullPage: true,
            })
        })
    })
}
