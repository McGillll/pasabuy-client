import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './specs',
    fullyParallel: true,
    retries: 2,
    reporter: [['list']],
    use: {
        baseURL: 'http://localhost:3010',
        launchOptions: {
            args: ['--disable-gpu', '--disable-software-rasterizer'],
        },
    },
    webServer: {
        command: 'pnpm dev --port 3010',
        url: 'http://localhost:3010',
        reuseExistingServer: true,
        timeout: 60_000,
        cwd: '../..',
        env: { NUXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8010/api' },
    },
    projects: [
        {
            name: 'mobile',
            use: {
                viewport: devices['iPhone 12'].viewport,
                userAgent: devices['iPhone 12'].userAgent,
                deviceScaleFactor: devices['iPhone 12'].deviceScaleFactor,
                isMobile: devices['iPhone 12'].isMobile,
                hasTouch: devices['iPhone 12'].hasTouch,
            },
        },
        {
            name: 'desktop',
            use: { viewport: { width: 1440, height: 900 } },
        },
    ],
})
