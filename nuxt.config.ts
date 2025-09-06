// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui-pro',
    '@vueuse/nuxt',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/mdc',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  build: {
    transpile: ['trpc-nuxt']
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-07-11',

  ssr: true,

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  uiPro: {
    mdc: true
  },

  i18n: {
    defaultLocale: 'es',
    bundle: {
      optimizeTranslationDirective: false
    },
    locales: [
      { code: 'en', files: [
        'en/app.json',
        'en/common.json',
        'en/customers.json',
        'en/projects.json',
        'en/settings.json'
      ] },
      {
        code: 'es', files: [
          'es/app.json',
          'es/common.json',
          'es/customers.json',
          'es/projects.json',
          'es/settings.json'
        ]
      }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected'
    },
    strategy: 'prefix_except_default',
    restructureDir: './',
    langDir: './locales'
  },

  runtimeConfig: {
    public: {
      appwriteEndpoint: process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT,
      appwriteProjectId: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID,
      appwriteProjectName: process.env.NUXT_PUBLIC_APPWRITE_PROJECT_NAME
    }
  }
})
