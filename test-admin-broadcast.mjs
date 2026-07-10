import { chromium } from '@playwright/test'

const SCHEDULE_UUID = '1558a12e-87c7-4963-a519-72233eca0fcb'
const TOKEN = 'jan7kP5PSDD5amJo4uq56JZwtGXRcBg3dlEkIWL6'
const PRODUCT_UUID = 'c418c73f-265d-4372-9947-54735561ed91' // Corned Beef 210g

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('pageerror', (err) => console.log('[pageerror]', err.message))
page.on('console', (msg) => { if (msg.type() === 'error') console.log('[console:error]', msg.text()) })

const loginRes = await fetch('http://127.0.0.1:8000/api/auth/login', {
    method: 'POST',
    body: (() => {
        const fd = new FormData()
        fd.append('email', 'admin@pasabuy.test')
        fd.append('password', 'password123')
        fd.append('remember', '0')
        return fd
    })()
})
const loginJson = await loginRes.json()
const token = loginJson.data.token
console.log('Got token', token)

await page.goto('http://localhost:3001/login')
await page.evaluate((t) => localStorage.setItem('_token', t), token)

await page.goto(`http://localhost:3001/admin/schedules/${SCHEDULE_UUID}`)
await page.waitForSelector('text=Shopping checklist', { timeout: 15000 })
console.log('Schedule page loaded')

// Click into Summary tab, then Checklist sub-tab to trigger startChecklistLiveSync via the watcher
const summaryTab = page.getByRole('tab', { name: /summary/i }).first()
if (await summaryTab.count()) await summaryTab.click()
await page.waitForTimeout(500)
const checklistTab = page.getByText('Shopping Checklist', { exact: false }).first()
if (await checklistTab.count()) await checklistTab.click()

await page.waitForTimeout(2000)

// Toggle from a different client (the public checklist endpoint) to simulate a helper checking an item off
const formData = new FormData()
formData.append('is_checked', '1')
formData.append('_method', 'PATCH')
const res = await fetch(`http://127.0.0.1:8000/api/public/checklist/${TOKEN}/${PRODUCT_UUID}`, {
    method: 'POST',
    body: formData
})
console.log('Public toggle status', res.status)

await page.waitForTimeout(2000)

const strikethroughCount = await page.locator('.line-through', { hasText: 'Corned Beef 210g' }).count()
console.log('Admin table shows Corned Beef checked live (should be >=1):', strikethroughCount)

await browser.close()
