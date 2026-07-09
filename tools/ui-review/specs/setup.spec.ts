import { test } from '@playwright/test'
import { FIXTURES } from '../fixtures'

async function loginAs(request: any, email: string, password: string) {
    const response = await request.post(`${FIXTURES.apiBaseURL}/auth/login`, {
        headers: { Accept: 'application/json' },
        multipart: { email, password, remember: '0' },
    })
    const body = await response.json()
    return body.data.token as string
}

async function saveStorageState(page: any, token: string, outPath: string) {
    await page.goto('/login')
    await page.evaluate((t: string) => localStorage.setItem('_token', t), token)
    await page.context().storageState({ path: outPath })
}

test('setup-seller', async ({ page, request }) => {
    const token = await loginAs(request, FIXTURES.seller.email, FIXTURES.seller.password)
    await saveStorageState(page, token, 'tools/ui-review/auth/seller.json')
})

test('setup-customer', async ({ page, request }) => {
    const token = await loginAs(request, FIXTURES.customer.email, FIXTURES.customer.password)
    await saveStorageState(page, token, 'tools/ui-review/auth/customer.json')
})
