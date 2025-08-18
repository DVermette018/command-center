<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import { useApi } from '~/api'

const route = useRoute()

// File upload ref
const projectId = route.params.id as string
const links = [[{
  label: 'Setup',
  icon: 'i-lucide-settings',
  to: `/projects/${projectId}/setup`,
  exact: true
}, {
  label: 'Overview',
  icon: 'i-lucide-eye',
  to: `/projects/${projectId}/overview`,
  disabled: true
}, {
  label: 'Plan',
  icon: 'i-lucide-credit-card',
  to: `/projects/${projectId}/plan`,
  disabled: true
}, {
  label: 'Invoices',
  icon: 'i-lucide-file-text',
  to: `/projects/${projectId}/invoices`,
  disabled: true
}, {
  label: 'Analytics',
  icon: 'i-lucide-bar-chart-2',
  to: `/projects/${projectId}/analytics`,
  disabled: true
}, {
  label: 'Preview',
  icon: 'i-lucide-eye-off',
  to: `/projects/${projectId}/preview`,
  disabled: true
}, {
  label: 'Settings',
  icon: 'i-lucide-cog',
  to: `/projects/${projectId}/settings`,
  disabled: true
}
]] satisfies NavigationMenuItem[][]

const api = useApi()

// Use the proper query hook for fetching project by ID
const { data: project, error, status } = await api.projects.getById(projectId)

// Handle errors appropriately
if (status.value === 'error' || !project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found'
  })
}

</script>

<template>
  <UDashboardPanel id="customer">
    <template #header>
      <UDashboardNavbar :title="project?.name || 'Loading...'" >
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
