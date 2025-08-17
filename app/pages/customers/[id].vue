<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import { useApi } from '~/api'

const api = useApi()
const route = useRoute()

const userId = route.params.id as string

const links = [[{
  label: 'Overview',
  icon: 'i-lucide-user',
  to: `/customers/${userId}`,
  exact: true
}, {
  label: 'Projects',
  icon: 'i-lucide-folder-dot',
  to: `/customers/${userId}/projects`
}, {
  label: 'Security',
  icon: 'i-lucide-shield',
  to: `/customers/${userId}/security`
}, {
  label: 'Billing',
  icon: 'i-lucide-credit-card',
  to: `/customers/${userId}/billing`
}]] satisfies NavigationMenuItem[][]

const customer = await api.customers.getById(userId)

if (!customer) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Customer not found'
  })
}

</script>

<template>
  <UDashboardPanel id="customer">
    <template #header>
      <UDashboardNavbar title="Customers" >
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>

        <template #right>

        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <UNavigationMenu :items="links" class="-mx-1 flex-1" highlight/>
      </UDashboardToolbar>
    </template>

    <template #body>
        <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
