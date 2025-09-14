<template>
  <div class="space-y-6">
    <!-- Project Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ project.name }}</h1>
        <p class="text-gray-600" v-if="project.description">{{ project.description }}</p>
      </div>
      <div class="flex items-center gap-3">
        <UBadge
          :color="getStatusColor(project.status)"
          variant="solid"
          size="lg"
        >
          {{ getStatusLabel(project.status) }}
        </UBadge>
        <UBadge
          :color="getPhaseColor(project.phase)"
          variant="outline"
          size="lg"
        >
          {{ getPhaseLabel(project.phase) }}
        </UBadge>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap gap-2">
      <ProjectsStatusModal
        :project-id="project.id"
        :current-status="project.status"
        @success="handleStatusUpdate"
      />
      <ProjectsPhaseModal
        :project-id="project.id"
        :current-phase="project.phase"
        trigger-icon="i-lucide-workflow"
        @success="handlePhaseUpdate"
      />
      <ProjectsEditModal
        :project="project"
        @success="handleProjectUpdate"
      />
    </div>

    <!-- Project Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Timeline Card -->
      <UPageCard
        class="h-full"
        title="Timeline"
        variant="subtle"
      >
        <div class="space-y-3">
          <div v-if="project.startDate" class="flex items-center gap-2">
            <Icon name="i-lucide-calendar-days" class="h-4 w-4 text-green-500" />
            <div>
              <p class="text-sm font-medium">Started</p>
              <p class="text-xs text-gray-600">{{ formatDate(project.startDate) }}</p>
            </div>
          </div>

          <div v-if="project.targetEndDate" class="flex items-center gap-2">
            <Icon name="i-lucide-target" class="h-4 w-4 text-blue-500" />
            <div>
              <p class="text-sm font-medium">Target</p>
              <p class="text-xs text-gray-600">{{ formatDate(project.targetEndDate) }}</p>
            </div>
          </div>

          <div v-if="project.actualEndDate" class="flex items-center gap-2">
            <Icon name="i-lucide-calendar-check" class="h-4 w-4 text-purple-500" />
            <div>
              <p class="text-sm font-medium">Completed</p>
              <p class="text-xs text-gray-600">{{ formatDate(project.actualEndDate) }}</p>
            </div>
          </div>

          <div v-if="!project.startDate && !project.targetEndDate" class="text-sm text-gray-500">
            No timeline set
          </div>
        </div>
      </UPageCard>

      <!-- Team Card -->
      <UPageCard
        class="h-full"
        title="Team"
        variant="subtle"
      >
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <UAvatar
              :alt="`${project.projectManager.firstName} ${project.projectManager.lastName}`"
              size="xs"
            />
            <div>
              <p class="text-sm font-medium">{{ project.projectManager.firstName }} {{ project.projectManager.lastName }}</p>
              <p class="text-xs text-gray-600">Project Manager</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Icon name="i-lucide-users" class="h-4 w-4 text-blue-500" />
            <div>
              <p class="text-sm font-medium">{{ teamMemberCount }} Team Members</p>
              <p class="text-xs text-gray-600">Active contributors</p>
            </div>
          </div>
        </div>
      </UPageCard>

      <!-- Budget Card -->
      <UPageCard
        class="h-full"
        title="Budget"
        variant="subtle"
      >
        <div class="space-y-2">
          <div v-if="project.budget && project.currency">
            <p class="text-2xl font-bold">{{ formatCurrency(project.budget, project.currency) }}</p>
            <p class="text-xs text-gray-600">Total Budget</p>
          </div>
          <div v-else class="text-sm text-gray-500">
            No budget set
          </div>
        </div>
      </UPageCard>

      <!-- Progress Card -->
      <UPageCard
        class="h-full"
        title="Progress"
        variant="subtle"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">Phase Progress</p>
            <p class="text-sm text-gray-600">{{ phaseProgress }}%</p>
          </div>
          <UProgress v-model="phaseProgress" class="h-2" />
          <p class="text-xs text-gray-600">{{ getPhaseProgressDescription() }}</p>
        </div>
      </UPageCard>
    </div>

    <!-- Phase History -->
    <UPageCard
      title="Phase History"
      description="Track project phases and milestones"
      variant="subtle"
    >
      <div v-if="isLoadingPhases" class="p-4 text-center">
        <UButton loading variant="ghost">Loading phase history...</UButton>
      </div>

      <div v-else-if="phaseHistory?.length === 0" class="p-8 text-center text-gray-500">
        <Icon name="i-lucide-timeline" class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No phase history available</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="phase in phaseHistory"
          :key="phase.id"
          class="flex items-center gap-4 p-3 border rounded-lg"
        >
          <div class="flex-shrink-0">
            <UBadge
              :color="getPhaseStatusColor(phase.status)"
              variant="solid"
            >
              {{ phase.status.replace('_', ' ') }}
            </UBadge>
          </div>
          <div class="flex-1">
            <h4 class="font-medium">{{ getPhaseLabel(phase.phase) }}</h4>
            <p class="text-sm text-gray-600">
              Started: {{ formatDate(phase.startedAt) }}
              <span v-if="phase.completedAt"> • Completed: {{ formatDate(phase.completedAt) }}</span>
            </p>
            <p v-if="phase.notes" class="text-sm text-gray-700 mt-1">{{ phase.notes }}</p>
          </div>
        </div>
      </div>
    </UPageCard>

    <!-- All modals are now self-contained with built-in triggers -->
  </div>
</template>

<script lang="ts" setup>
import { format } from 'date-fns'
import type { ProjectDTO, ProjectStatus, ProjectPhase } from '~~/dto/project'
import { useApi } from '~/api'

interface Props {
  project: ProjectDTO
}

interface Emits {
  updated: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const api = useApi()

// No modal refs needed - all modals are self-contained

// Phase history data
const { data: phaseHistory, isLoading: isLoadingPhases } = api.projects.useGetPhaseHistoryQuery(props.project.id)

// Computed properties
const teamMemberCount = computed(() => {
  return props.project.teamMembers?.length || 0
})

const phaseProgress = computed(() => {
  const phases = ['DISCOVERY', 'PLANNING', 'DESIGN', 'DEVELOPMENT', 'REVIEW', 'TESTING', 'LAUNCH', 'POST_LAUNCH', 'MAINTENANCE']
  const currentPhaseIndex = phases.indexOf(props.project.phase)
  return Math.round(((currentPhaseIndex + 1) / phases.length) * 100)
})

// Helper functions
const getStatusColor = (status: ProjectStatus) => {
  const colors = {
    DRAFT: 'gray',
    PENDING_APPROVAL: 'yellow',
    ACTIVE: 'green',
    ON_HOLD: 'orange',
    COMPLETED: 'blue',
    CANCELLED: 'red',
    ARCHIVED: 'gray'
  }
  return colors[status] || 'gray'
}

const getStatusLabel = (status: ProjectStatus) => {
  const labels = {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Approval',
    ACTIVE: 'Active',
    ON_HOLD: 'On Hold',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ARCHIVED: 'Archived'
  }
  return labels[status] || status
}

const getPhaseColor = (phase: ProjectPhase) => {
  const colors = {
    DISCOVERY: 'purple',
    PLANNING: 'blue',
    DESIGN: 'pink',
    DEVELOPMENT: 'orange',
    REVIEW: 'yellow',
    TESTING: 'red',
    LAUNCH: 'green',
    POST_LAUNCH: 'teal',
    MAINTENANCE: 'gray'
  }
  return colors[phase] || 'gray'
}

const getPhaseLabel = (phase: ProjectPhase) => {
  const labels = {
    DISCOVERY: 'Discovery',
    PLANNING: 'Planning',
    DESIGN: 'Design',
    DEVELOPMENT: 'Development',
    REVIEW: 'Review',
    TESTING: 'Testing',
    LAUNCH: 'Launch',
    POST_LAUNCH: 'Post-Launch',
    MAINTENANCE: 'Maintenance'
  }
  return labels[phase] || phase
}

const getPhaseStatusColor = (status: string) => {
  const colors = {
    NOT_STARTED: 'gray',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    SKIPPED: 'orange'
  }
  return colors[status as keyof typeof colors] || 'gray'
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

const getPhaseProgressDescription = () => {
  const phase = getPhaseLabel(props.project.phase)
  const progress = phaseProgress.value

  if (progress < 30) return `Early stage - ${phase}`
  if (progress < 70) return `Mid-stage - ${phase}`
  return `Advanced stage - ${phase}`
}

// No modal handlers needed - all modals are self-contained

const handleStatusUpdate = (newStatus: ProjectStatus) => {
  emit('updated')
}

const handlePhaseUpdate = (newPhase: ProjectPhase) => {
  emit('updated')
}

const handleProjectUpdate = () => {
  emit('updated')
}
</script>
