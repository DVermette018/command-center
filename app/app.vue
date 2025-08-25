<script setup lang="ts">
// import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { useQueryClient } from '@tanstack/vue-query'

// Extend Window interface for TanStack Query Client
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__?: any
  }
}

const colorMode = useColorMode()
const { t } = useI18n()

const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = computed(() => t('app.meta.title'))
const description = computed(() => t('app.meta.description'))

useSeoMeta({
  title: title.value,
  description: description.value,
  ogTitle: title.value,
  ogDescription: description.value,
  ogImage: 'https://assets.hub.nuxt.com/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJodHRwczovL2Rhc2hib2FyZC10ZW1wbGF0ZS5udXh0LmRldiIsImlhdCI6MTczOTQ2MzU2N30._VElt4uvLjvAMdnTLytCInOajMElzWDKbmvOaMZhZUI.jpg?theme=light',
  twitterImage: 'https://assets.hub.nuxt.com/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJodHRwczovL2Rhc2hib2FyZC10ZW1wbGF0ZS5udXh0LmRldiIsImlhdCI6MTczOTQ2MzU2N30._VElt4uvLjvAMdnTLytCInOajMElzWDKbmvOaMZhZUI.jpg?theme=light',
  twitterCard: 'summary_large_image'
})
onMounted(() => {
  window.__TANSTACK_QUERY_CLIENT__ = useQueryClient()
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
