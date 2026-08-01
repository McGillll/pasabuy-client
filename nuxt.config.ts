// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Pasabuy',
      titleTemplate: 'Pasabuy · %s',
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' }
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#4274d9' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Pasabuy' }
      ]
    }
  },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  runtimeConfig: {
    public: {
      apiBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api',
      wsAppKey: process.env.NUXT_PUBLIC_WS_APP_KEY || '',
      wsHost: process.env.NUXT_PUBLIC_WS_HOST || '127.0.0.1',
      wsPort: process.env.NUXT_PUBLIC_WS_PORT || '8080',
      wsScheme: process.env.NUXT_PUBLIC_WS_SCHEME || 'http'
    }
  }
})