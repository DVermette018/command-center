<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import { useApi } from '~/api'

const route = useRoute()
const router = useRouter()

const projectId = route.params.id as string

// Navigation tabs
const links = [[{
  label: 'Overview',
  icon: 'i-lucide-eye',
  to: `/projects/${projectId}`,
  exact: true
}, {
  label: 'Team',
  icon: 'i-lucide-users',
  to: `/projects/${projectId}/team`
}, {
  label: 'Setup',
  icon: 'i-lucide-settings',
  to: `/projects/${projectId}/setup`
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
}]] satisfies NavigationMenuItem[][]

const api = useApi()

// Fetch project data
const { data: project, status } = api.projects.useGetByIdQuery(projectId)

// Current tab state
const currentTab = computed(() => {
  const path = route.path
  if (path.includes('/team')) return 'team'
  if (path.includes('/setup')) return 'setup'
  return 'overview'
})

// Handle errors appropriately
if (status.value === 'error') {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found'
  })
}

</script>

<template>
  <UDashboardPanel id="project-detail">
    <template #header>
      <UDashboardNavbar :title="project?.name || 'Loading...'" >
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>

        <template #right>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            @click="router.push('/projects')"
          >
            Back to Projects
          </UButton>
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <UNavigationMenu :items="links" class="-mx-1 flex-1" highlight/>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="project">
        <!-- Overview Tab (default) -->
        <ProjectsProjectOverview
          v-if="currentTab === 'overview'"
          :project="project"
        />

        <!-- Team Tab -->
        <ProjectsTeamManagement
          v-else-if="currentTab === 'team'"
          :project-id="projectId"
          :project="project"
        />

        <!-- Setup Tab (existing functionality) -->
        <div v-else-if="currentTab === 'setup'">
          <NuxtPage />
        </div>

        <!-- Fallback -->
        <div v-else>
          <NuxtPage />
        </div>
      </div>

      <div v-else class="p-6 text-center">
        <UButton loading variant="ghost">Loading project...</UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>
