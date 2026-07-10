// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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